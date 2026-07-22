<?php

namespace App\Http\Controllers;

use App\Http\Requests\IncidenciasRequest;
use App\Models\HistorialIncidencia;
use App\Models\Incidencia;
use App\Models\Territorio;
use App\Models\User;
use App\Services\IncidenciaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Notifications\IssueAssignedNotification;
use App\Notifications\IssueStatusChangedNotification;

class IncidenciaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // Automatic state transition: when Supervisor queries list, Pendiente (1) -> En Revisión (2)
        if ($user && $user->roles()->where('nombre', 'Supervisor')->exists()) {
            $transitionQuery = Incidencia::where('estado_id', 1);
            $territorioIds = $user->territorios()->pluck('territorios.id')->toArray();
            if (! empty($territorioIds)) {
                $descendientesIds = Territorio::obtenerDescendientesIds($territorioIds);
                $transitionQuery->whereHas('direccion', function ($q) use ($descendientesIds) {
                    $q->whereIn('territorio_id', $descendientesIds);
                });
            } elseif ($user->pais_id) {
                $transitionQuery->whereHas('direccion.territorio', function ($q) use ($user) {
                    $q->where('pais_id', $user->pais_id);
                });
            }

            $incidenciasTransition = $transitionQuery->get();
            foreach ($incidenciasTransition as $inc) {
                $inc->update(['estado_id' => 2]);
                
                $this->despacharNotificaciones($inc, 1, []);
            }
        }

        $query = Incidencia::with([
            'direccion.territorio.pais',
            'estado',
            'institucion',
            'tipo',
            'subTipo',
            'prioridad',
            'cliente',
            'operadores',
            'reportantes',
            'recursos'
        ]);

        if ($user && ! $user->roles()->where('nombre', 'Admin')->exists()) {
            if ($user->roles()->where('nombre', 'Supervisor')->exists()) {
                $territorioIds = $user->territorios()->pluck('territorios.id')->toArray();
                if (! empty($territorioIds)) {
                    $descendientesIds = Territorio::obtenerDescendientesIds($territorioIds);
                    $query->whereHas('direccion', function ($q) use ($descendientesIds) {
                        $q->whereIn('territorio_id', $descendientesIds);
                    });
                } else {
                    $query->whereRaw('1 = 0');
                }
            } elseif ($user->roles()->where('nombre', 'Institucion')->exists()) {
                $query->where('institucion_id', $user->institucion_id);
            } else {
                $query->where(function ($q) use ($user) {
                    $q->where('cliente_id', $user->id)
                        ->orWhereHas('reportantes', function ($q2) use ($user) {
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

        if ($request->query('all') === 'true' || $request->query('all') === '1') {
            return response()->json($query->orderBy('id', 'desc')->get(), 200);
        }

        $perPage = $request->input('per_page', 15);
        return response()->json($query->orderBy('id', 'desc')->cursorPaginate($perPage), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(IncidenciasRequest $request, IncidenciaService $service)
    {
        $result = $service->createIncidencia($request->validated() + $request->all(), auth()->user());

        if (isset($result['data']['id'])) {
            $nuevaIncidencia = Incidencia::find($result['data']['id']);
            if ($nuevaIncidencia) {
                $this->despacharNotificaciones($nuevaIncidencia, null, []);
            }
        }

        return response()->json([
            'message' => $result['message'],
            'data' => $result['data'],
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $incidencia = Incidencia::with([
            'direccion.territorio.pais',
            'direccion.territorio.parent',
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
    public function update(IncidenciasRequest $request, $id, IncidenciaService $service)
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

        $oldEstadoId = $incidencia->estado_id;
        $oldOperadoresIds = $incidencia->operadores()->pluck('users.id')->toArray();

        // Ejecutamos la actualización del servicio
        $result = $service->updateIncidencia($incidencia, $request->validated() + $request->all(), $user);

        $incidencia->refresh();
        $this->despacharNotificaciones($incidencia, $oldEstadoId, $oldOperadoresIds);

        return response()->json([
            'message' => $result['message'],
            'data' => $result['data'],
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
     * Get the history/comments of the incident (paginated).
     */
    public function getHistorial($id)
    {
        $incidencia = Incidencia::findOrFail($id);
        $user = auth()->user();

        if ($user && ! $this->checkAccess($user, $incidencia)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $perPage = request()->input('per_page', 15);
        $historial = $incidencia->historial()->with(['usuario', 'estado'])->orderBy('created_at', 'desc')->paginate($perPage);

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

        $historial = HistorialIncidencia::create([
            'incidencia_id' => $incidencia->id,
            'estado_id' => $incidencia->estado_id,
            'usuario_id' => $user ? $user->id : null,
            'comentario' => $request->input('comentario'),
        ]);

        return response()->json([
            'message' => 'Comentario agregado con éxito',
            'data' => $historial->load(['usuario', 'estado']),
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
            $territorioIds = $user->territorios()->pluck('territorios.id')->toArray();
            if (! empty($territorioIds)) {
                $descendientesIds = Territorio::obtenerDescendientesIds($territorioIds);
                if (! $incidencia->direccion || ! in_array($incidencia->direccion->territorio_id, $descendientesIds)) {
                    return false;
                }
            } else {
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

        if ($incidencia->cliente_id === $user->id) {
            return true;
        }

        return $incidencia->reportantes()->where('usuario_incidencia.user_id', $user->id)->exists();
    }

    /**
     * 
     * Evalúa qué cambió en la incidencia y dispara alertas vía Reverb y BD.
     */
    private function despacharNotificaciones(Incidencia $incidencia, $oldEstadoId = null, array $oldOperadoresIds = []): void
    {
        // Cargamos relaciones necesarias para construir mensajes ricos
        $incidencia->load(['estado', 'operadores', 'cliente', 'reportantes', 'direccion']);

        // 1. ¿CAMBIÓ EL ESTADO? -> Notificamos a cliente, reportantes y operadores
        if ($oldEstadoId && $oldEstadoId !== $incidencia->estado_id) {
            $destinatarios = collect([$incidencia->cliente])
                ->merge($incidencia->reportantes)
                ->merge($incidencia->operadores)
                ->filter() // Elimina nulos
                ->unique('id');

            foreach ($destinatarios as $destinatario) {
                $destinatario->notify(new IssueStatusChangedNotification([
                    'title'         => "Incidencia #{$incidencia->id}: Cambio de Estado",
                    'message'       => "El reporte ha cambiado a: " . ($incidencia->estado->nombre ?? 'Actualizado'),
                    'url'           => "/tramites/estado-individual?id={$incidencia->id}", 
                    'type'          => 'info',
                    'incidencia_id' => $incidencia->id,
                ]));
            }
        }

        // 2. ¿SE ASIGNARON NUEVOS OPERADORES? -> Alerta directa de asignación
        $newOperadoresIds = $incidencia->operadores->pluck('id')->toArray();
        $nuevosAsignadosIds = array_diff($newOperadoresIds, $oldOperadoresIds);

        if (! empty($nuevosAsignadosIds)) {
            $nuevosOperadores = User::whereIn('id', $nuevosAsignadosIds)->get();
            
            foreach ($nuevosOperadores as $operador) {
                $operador->notify(new IssueAssignedNotification([
                    'title'         => "Nueva Incidencia Asignada (#{$incidencia->id})",
                    'message'       => "Se te ha despachado para atender: " . ($incidencia->direccion->calle ?? 'Ubicación registrada'),
                    'url'           => "/instituciones/kanban",
                    'type'          => 'danger',
                    'incidencia_id' => $incidencia->id,
                    'color_hex'     => '#dc3545',
                ]));
            }
        }
    }
}
