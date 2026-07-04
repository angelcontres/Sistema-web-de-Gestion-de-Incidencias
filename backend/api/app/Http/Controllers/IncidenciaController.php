<?php

namespace App\Http\Controllers;

use App\Models\Incidencia;
use App\Models\CategoriaIncidencia;
use App\Http\Requests\IncidenciasRequest;
use Illuminate\Http\Request;

class IncidenciaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Incidencia::with([
            'direccion.territorio.pais',
            'cliente',
            'estado',
            'institucion',
            'tipo',
            'subTipo',
            'prioridad',
            'operadores'
        ]);

        if ($user && !$user->roles()->where('nombre', 'Admin')->exists()) {
            if ($user->roles()->where('nombre', 'Operador')->exists()) {
                if ($user->pais_id) {
                    $query->whereHas('direccion.territorio', function ($q) use ($user) {
                        $q->where('pais_id', $user->pais_id);
                    });
                }
            } else if ($user->roles()->where('nombre', 'Institucion')->exists()) {
                $query->where('institucion_id', $user->institucion_id);
            } else {
                // If they are regular citizens, they can only see their own reports
                $query->where('cliente_id', $user->id);
            }
        }

        return response()->json($query->orderBy('id', 'desc')->get(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(IncidenciasRequest $request)
    {
        $user = auth()->user();

        // Calculate initial priority based on subcategory and affected count
        $prioridadId = $this->calculatePriority(
            $request->sub_tipo_incidencia_id,
            $request->cantidad_afectados_incidencia
        );

        $incidencia = Incidencia::create([
            'incidencia_descripcion' => $request->incidencia_descripcion,
            'direccion_id' => $request->direccion_id,
            'cliente_id' => $user ? $user->id : null,
            'estado_id' => $request->input('estado_id', 2), // Default: En Revisión (2)
            'institucion_id' => $request->institucion_id,
            'tipo_incidencia_id' => $request->tipo_incidencia_id,
            'sub_tipo_incidencia_id' => $request->sub_tipo_incidencia_id,
            'prioridad_id' => $prioridadId,
            'cantidad_afectados_incidencia' => $request->cantidad_afectados_incidencia,
            'version' => 1,
            'created_by' => $user ? $user->id : null,
        ]);

        return response()->json([
            'message' => 'Incidencia creada con éxito',
            'data' => $incidencia->load([
                'direccion.territorio.pais',
                'cliente',
                'estado',
                'institucion',
                'tipo',
                'subTipo',
                'prioridad',
                'operadores'
            ]),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $incidencia = Incidencia::with([
            'direccion.territorio.pais',
            'cliente',
            'estado',
            'institucion',
            'tipo',
            'subTipo',
            'prioridad',
            'operadores'
        ])->findOrFail($id);

        $user = auth()->user();
        if ($user && !$this->checkAccess($user, $incidencia)) {
            return response()->json(['message' => 'No autorizado para ver esta incidencia.'], 403);
        }

        return response()->json($incidencia, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(IncidenciasRequest $request, $id)
    {
        $incidencia = Incidencia::findOrFail($id);
        $user = auth()->user();

        if ($user && !$this->checkAccess($user, $incidencia)) {
            return response()->json(['message' => 'No autorizado para modificar esta incidencia.'], 403);
        }

        // Optimistic locking check
        if ($incidencia->version !== (int) $request->input('version')) {
            return response()->json([
                'message' => 'La incidencia ha sido modificada por otro usuario. Por favor, recarga la página.'
            ], 409);
        }

        // Handle priority recalculation if subtipo or afectados changed
        $subTipoId = $request->input('sub_tipo_incidencia_id', $incidencia->sub_tipo_incidencia_id);
        $afectados = $request->input('cantidad_afectados_incidencia', $incidencia->cantidad_afectados_incidencia);
        $prioridadId = $this->calculatePriority($subTipoId, $afectados);

        $incidencia->update([
            'incidencia_descripcion' => $request->input('incidencia_descripcion', $incidencia->incidencia_descripcion),
            'direccion_id' => $request->input('direccion_id', $incidencia->direccion_id),
            'estado_id' => $request->input('estado_id', $incidencia->estado_id),
            'institucion_id' => $request->input('institucion_id', $incidencia->institucion_id),
            'tipo_incidencia_id' => $request->input('tipo_incidencia_id', $incidencia->tipo_incidencia_id),
            'sub_tipo_incidencia_id' => $subTipoId,
            'prioridad_id' => $prioridadId,
            'cantidad_afectados_incidencia' => $afectados,
            'version' => $incidencia->version + 1, // Increment version
            'updated_by' => $user ? $user->id : null,
        ]);

        return response()->json([
            'message' => 'Incidencia actualizada con éxito',
            'data' => $incidencia->load([
                'direccion.territorio.pais',
                'cliente',
                'estado',
                'institucion',
                'tipo',
                'subTipo',
                'prioridad',
                'operadores'
            ]),
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $incidencia = Incidencia::findOrFail($id);
        $user = auth()->user();

        if ($user && !$this->checkAccess($user, $incidencia)) {
            return response()->json(['message' => 'No autorizado para eliminar esta incidencia.'], 403);
        }

        $incidencia->update([
            'deleted_by' => $user ? $user->id : null,
        ]);
        $incidencia->delete();

        return response()->json([
            'message' => 'Incidencia eliminada con éxito'
        ], 200);
    }

    /**
     * Recalculates the priority of an incident based on the subcategory priority and affected count.
     */
    private function calculatePriority(int $subTipoId, int $afectados): ?int
    {
        $subtipo = CategoriaIncidencia::find($subTipoId);
        if (!$subtipo) {
            return null;
        }

        $basePriorityId = $subtipo->prioridad_id;
        if (!$basePriorityId) {
            return null;
        }

        // If >= 10 affected people, we recalculate/increase the priority level:
        // Baja (4) -> Media (3)
        // Media (3) -> Alta (2)
        // Alta (2) -> Crítica (1)
        if ($afectados >= 10) {
            if ($basePriorityId == 2) { // Alta
                return 1; // Crítica
            } elseif ($basePriorityId == 3) { // Media
                return 2; // Alta
            } elseif ($basePriorityId == 4) { // Baja
                return 3; // Media
            }
        }

        return $basePriorityId;
    }

    /**
     * Checks if the user has access to read or write the incident.
     */
    private function checkAccess($user, $incidencia): bool
    {
        if ($user->roles()->where('nombre', 'Admin')->exists()) {
            return true;
        }

        if ($user->roles()->where('nombre', 'Operador')->exists()) {
            if ($user->pais_id && $incidencia->direccion && $incidencia->direccion->territorio && $incidencia->direccion->territorio->pais_id != $user->pais_id) {
                return false;
            }
            return true;
        }

        if ($user->roles()->where('nombre', 'Institucion')->exists()) {
            if ($incidencia->institucion_id != $user->institucion_id) {
                return false;
            }
            return true;
        }

        return false;
    }
}
