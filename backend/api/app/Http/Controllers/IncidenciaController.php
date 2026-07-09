<?php

namespace App\Http\Controllers;

use App\Http\Requests\IncidenciasRequest;
use App\Models\CategoriaIncidencia;
use App\Models\Incidencia;
use App\Models\HistorialIncidencia;
use App\Models\Direccion;
use App\Services\IncidentGroupingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class IncidenciaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // Automatic state transition: when Supervisor queries list, Pendiente (2) -> En Revisión (3)
        if ($user && $user->roles()->where('nombre', 'Supervisor')->exists()) {
            $transitionQuery = Incidencia::where('estado_id', 2);
            if ($user->pais_id) {
                $transitionQuery->whereHas('direccion.territorio', function ($q) use ($user) {
                    $q->where('pais_id', $user->pais_id);
                });
            }
            $incidenciasTransition = $transitionQuery->get();
            foreach ($incidenciasTransition as $inc) {
                $inc->update(['estado_id' => 3]);
            }
        }

        $query = Incidencia::with([
            'direccion.territorio.pais',
            'cliente',
            'estado',
            'institucion',
            'tipo',
            'subTipo',
            'prioridad',
            'operadores',
            'reportantes',
            'recursos',
        ]);

        if ($user && ! $user->roles()->where('nombre', 'Admin')->exists()) {
            if ($user->roles()->where('nombre', 'Supervisor')->exists()) {
                if ($user->pais_id) {
                    $query->whereHas('direccion.territorio', function ($q) use ($user) {
                        $q->where('pais_id', $user->pais_id);
                    });
                }
            } elseif ($user->roles()->where('nombre', 'Institucion')->exists()) {
                $query->where('institucion_id', $user->institucion_id);
            } else {
                // If they are regular citizens, they can only see their own reports (or ones they are attached to)
                $query->where(function($q) use ($user) {
                    $q->where('cliente_id', $user->id)
                      ->orWhereHas('reportantes', function($q2) use ($user) {
                          $q2->where('user_id', $user->id);
                      });
                });
            }
        }

        if ($request->has('estado_id')) {
            $query->where('estado_id', $request->estado_id);
        }

        if ($request->has('tipo_incidencia_id')) {
            $query->where('tipo_incidencia_id', $request->tipo_incidencia_id);
        }

        return response()->json($query->orderBy('id', 'desc')->get(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(IncidenciasRequest $request)
    {
        $user = auth()->user();
        $direccionId = $request->direccion_id;

        if ($direccionId) {
            $direccion = Direccion::find($direccionId);
            if ($direccion) {
                $groupingService = app(IncidentGroupingService::class);
                $similar = $groupingService->findSimilarIncident(
                    (int) $request->tipo_incidencia_id,
                    (int) $request->sub_tipo_incidencia_id,
                    (float) $direccion->latitud,
                    (float) $direccion->longitud
                );

                if ($similar) {
                    // Increment affected count
                    $similar->cantidad_afectados_incidencia += 1;
                    $similar->prioridad_id = $this->calculatePriority(
                        $similar->sub_tipo_incidencia_id,
                        $similar->cantidad_afectados_incidencia
                    );
                    $similar->save();

                    // Associate user and save description
                    if ($user) {
                        $exists = DB::table('usuario_incidencia')
                            ->where('user_id', $user->id)
                            ->where('reporte_incidencia_id', $similar->id)
                            ->exists();
                        if (!$exists) {
                            $similar->reportantes()->attach($user->id, [
                                'created_by' => $user->id
                            ]);
                        }

                        // Save the new description in the history
                        HistorialIncidencia::create([
                            'incidencia_id' => $similar->id,
                            'estado_id' => $similar->estado_id,
                            'usuario_id' => $user->id,
                            'comentario' => 'Reporte ciudadano coincidente adjuntado: ' . $request->incidencia_descripcion
                        ]);
                    }

                    // Delete the newly created address if it is not used elsewhere
                    $isReferenced = Incidencia::where('direccion_id', $direccion->id)
                        ->where('id', '!=', $similar->id)
                        ->exists();
                    if (!$isReferenced) {
                        $direccion->delete();
                    }

                    return response()->json([
                        'message' => 'Incidencia agrupada con éxito con reporte similar existente.',
                        'data' => $similar->load([
                            'direccion.territorio.pais',
                            'cliente',
                            'estado',
                            'institucion',
                            'tipo',
                            'subTipo',
                            'prioridad',
                            'operadores',
                            'reportantes',
                        ]),
                    ], 200);
                }
            }
        }

        // If no similar incident found, create a new one
        $afectados = max((int) $request->input('cantidad_afectados_incidencia', 1), 1);
        $prioridadId = $this->calculatePriority(
            $request->sub_tipo_incidencia_id,
            $afectados
        );

        $incidencia = Incidencia::create([
            'incidencia_descripcion' => $request->incidencia_descripcion,
            'direccion_id' => $direccionId,
            'cliente_id' => $user ? $user->id : null,
            'estado_id' => $request->input('estado_id', 2), // Default: En Revisión (2)
            'institucion_id' => $request->institucion_id,
            'tipo_incidencia_id' => $request->tipo_incidencia_id,
            'sub_tipo_incidencia_id' => $request->sub_tipo_incidencia_id,
            'prioridad_id' => $prioridadId,
            'cantidad_afectados_incidencia' => $afectados,
            'version' => 1,
            'created_by' => $user ? $user->id : null,
        ]);

        if ($user) {
            $incidencia->reportantes()->attach($user->id, [
                'created_by' => $user->id
            ]);
        }

        if ($request->has('recursos')) {
            $disk = env('FILESYSTEM_DISK', 'public');

            foreach ($request->input('recursos') as $base64Image) {
                // Procesar el formato Base64 (ej: "data:image/webp;base64,UklGRg...")
                if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
                    $base64Image = substr($base64Image, strpos($base64Image, ',') + 1);
                    $extension = strtolower($type[1]);
                } else {
                    $extension = 'webp';
                }
                $imageDecoded = base64_decode($base64Image);
                if ($imageDecoded === false) {
                    continue; // Omitir si el base64 no es válido
                }
                // Generar nombre de archivo único
                $fileName = 'incidencias/' . Str::uuid() . '.' . $extension;
                // Subir al almacenamiento (S3 o Local según el .env)
                Storage::disk($disk)->put($fileName, $imageDecoded);
                // Registrar en la BD (guardamos la ruta relativa)
                $incidencia->recursos()->create([
                    'url' => $fileName,
                    'tipo' => 'imagen'
                ]);
            }

        }

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
                'operadores',
                'reportantes',
                'recursos',
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
            'operadores',
            'reportantes',
            'recursos',
        ])->findOrFail($id);

        $user = auth()->user();
        if ($user && ! $this->checkAccess($user, $incidencia)) {
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

        if ($user && ! $this->checkAccess($user, $incidencia)) {
            return response()->json(['message' => 'No autorizado para modificar esta incidencia.'], 403);
        }

        // Optimistic locking check
        if ($incidencia->version !== (int) $request->input('version')) {
            return response()->json([
                'message' => 'La incidencia ha sido modificada por otro usuario. Por favor, recarga la página.',
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

        if ($request->has('recursos')) {
            $disk = env('FILESYSTEM_DISK', 'public');

            foreach ($request->input('recursos') as $base64Image) {
                // Procesar el formato Base64 (ej: "data:image/webp;base64,UklGRg...")
                if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
                    $base64Image = substr($base64Image, strpos($base64Image, ',') + 1);
                    $extension = strtolower($type[1]);
                } else {
                    $extension = 'webp';
                }
                $imageDecoded = base64_decode($base64Image);
                if ($imageDecoded === false) {
                    continue; // Omitir si el base64 no es válido
                }
                // Generar nombre de archivo único
                $fileName = 'incidencias/' . Str::uuid() . '.' . $extension;
                // Subir al almacenamiento (S3 o Local según el .env)
                Storage::disk($disk)->put($fileName, $imageDecoded);
                // Registrar en la BD (guardamos la ruta relativa)
                $incidencia->recursos()->create([
                    'url' => $fileName,
                    'tipo' => 'imagen'
                ]);
            }
        }

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
                'operadores',
                'reportantes',
                'recursos',
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

        if ($user && ! $this->checkAccess($user, $incidencia)) {
            return response()->json(['message' => 'No autorizado para eliminar esta incidencia.'], 403);
        }

        $incidencia->update([
            'deleted_by' => $user ? $user->id : null,
        ]);
        $incidencia->delete();

        return response()->json([
            'message' => 'Incidencia eliminada con éxito',
        ], 200);
    }

    /**
     * Recalculates the priority of an incident based on the subcategory priority and affected count.
     */
    private function calculatePriority(int $subTipoId, int $afectados): ?int
    {
        $subtipo = CategoriaIncidencia::find($subTipoId);
        if (! $subtipo) {
            return null;
        }

        $basePriorityId = $subtipo->prioridad_id;
        if (! $basePriorityId) {
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
     * Get the history/comments of the incident (paginated).
     */
    public function getHistorial($id)
    {
        $incidencia = Incidencia::findOrFail($id);
        $user = auth()->user();

        if ($user && ! $this->checkAccess($user, $incidencia)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $historial = $incidencia->historial()->with(['usuario', 'estado'])->orderBy('created_at', 'desc')->paginate(10);
        return response()->json($historial, 200);
    }

    /**
     * Add a comment without changing the state.
     */
    public function addComment(Request $request, $id)
    {
        $request->validate([
            'comentario' => 'required|string|max:200',
        ]);

        $incidencia = Incidencia::findOrFail($id);
        $user = auth()->user();

        if ($user && ! $this->checkAccess($user, $incidencia)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $historial = \App\Models\HistorialIncidencia::create([
            'incidencia_id' => $incidencia->id,
            'estado_id' => $incidencia->estado_id, // Keep current state
            'usuario_id' => $user ? $user->id : null,
            'comentario' => $request->input('comentario'),
        ]);

        return response()->json([
            'message' => 'Comentario agregado con éxito',
            'data' => $historial->load(['usuario', 'estado'])
        ], 201);
    }

    /**
     * Checks if the user has access to read or write the incident.
     */
    private function checkAccess($user, $incidencia): bool
    {
        if ($user->roles()->where('nombre', 'Admin')->exists()) {
            return true;
        }

        if ($user->roles()->where('nombre', 'Supervisor')->exists()) {
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

        // Citizens can view their own reported incidences (either as creator or as an attached reportante)
        if ($incidencia->cliente_id === $user->id) {
            return true;
        }

        return $incidencia->reportantes()->where('usuario_incidencia.user_id', $user->id)->exists();
    }
}
