<?php

namespace App\Http\Controllers;

use App\Models\Incidencia;
use App\Services\TimezoneService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $kpis = $this->calculateKpis();
        $topServices = $this->getTopServices(30);
        $recentIncidents = $this->getRecentIncidents(5);
        $mapMarkers = $this->getMapMarkers();

        return response()->json([
            'kpis' => $kpis,
            'servicios_mas_utilizados' => $topServices,
            'recientes' => $recentIncidents,
            'mapa_reportes' => $mapMarkers,
        ]);
    }

    private function calculateKpis()
    {
        $now = TimezoneService::nowLocal();

        $activas = Incidencia::whereIn('estado_id', [1, 2])->count();

        $nuevasActivas = Incidencia::whereIn('estado_id', [1, 2])
            ->where('created_at', '>=', $now->copy()->setTimezone('UTC')->subHours(2))
            ->count();

        $sinAsignar = Incidencia::whereNull('institucion_id')->count();

        $startOfDay = $now->copy()->startOfDay()->setTimezone('UTC');
        $endOfDay = $now->copy()->endOfDay()->setTimezone('UTC');

        $resueltasHoy = Incidencia::where('estado_id', 4)
            ->whereBetween('updated_at', [$startOfDay, $endOfDay])
            ->count();

        return [
            'activas' => $activas,
            'nuevas_activas_2h' => $nuevasActivas,
            'sin_asignar' => $sinAsignar,
            'resueltas_hoy' => $resueltasHoy,
            'tiempo_respuesta' => '18 min', // Placeholder for average response time si fuera real
        ];
    }

    private function getTopServices($days = 30)
    {
        $startDate = TimezoneService::nowLocal()->subDays($days)->startOfDay()->setTimezone('UTC');

        $totalIncidents = Incidencia::where('created_at', '>=', $startDate)->count();

        if ($totalIncidents === 0) {
            return [];
        }

        $topServices = Incidencia::select('tipo_incidencia_id', DB::raw('count(*) as total'))
            ->where('created_at', '>=', $startDate)
            ->whereNotNull('tipo_incidencia_id')
            ->groupBy('tipo_incidencia_id')
            ->orderByDesc('total')
            ->limit(4)
            ->with('tipo')
            ->get();

        $colors = ['primary', 'warning', 'danger', 'success'];

        return $topServices->map(function ($service, $index) use ($totalIncidents, $colors) {
            $percentage = round(($service->total / $totalIncidents) * 100);

            return [
                'nombre' => $service->tipo ? $service->tipo->nombre : 'Desconocido',
                'porcentaje' => $percentage,
                'color' => $colors[$index % count($colors)],
            ];
        });
    }

    private function getRecentIncidents($limit = 5)
    {
        return Incidencia::with(['tipo', 'estado', 'direccion'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function (Incidencia $incidencia) {
                return [
                    'id' => $incidencia->id,
                    'descripcion' => $incidencia->incidencia_descripcion,
                    'categoria' => $incidencia->tipo ? $incidencia->tipo->nombre : '-',
                    'ubicacion' => $incidencia->direccion ? $incidencia->direccion->detalle : 'Sin dirección',
                    'prioridad' => 'Media',
                    'estado' => $incidencia->estado ? $incidencia->estado->nombre : 'Pendiente',
                    'reportado' => $incidencia->created_at->diffForHumans(),
                ];
            });
    }

    private function getMapMarkers()
    {
        return Incidencia::with('direccion', 'tipo')
            ->whereNotNull('direccion_id')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->filter(function (Incidencia $incidencia) {
                return $incidencia->direccion && $incidencia->direccion->latitud && $incidencia->direccion->longitud;
            })
            ->map(function (Incidencia $incidencia) {
                return [
                    'id' => $incidencia->id,
                    'lat' => $incidencia->direccion->latitud,
                    'lng' => $incidencia->direccion->longitud,
                    'titulo' => $incidencia->incidencia_descripcion,
                    'categoria' => $incidencia->tipo ? $incidencia->tipo->nombre : '',
                ];
            })->values();
    }

    public function metrics(Request $request)
    {
        $role = $request->query('role', 'Ciudadano');
        $user = $request->user();

        $now = TimezoneService::nowLocal()->setTimezone('UTC');
        $startOfRange = $now->copy()->subDays(30);
        $data = [];

        if ($role === 'Ciudadano') {
            $data['kpis'] = [
                'mis_reportes' => DB::table('metrics.fact_incidencias')->where('usuario_reporta_id', $user->id)->count(),
                'solucionados' => DB::table('metrics.fact_incidencias')
                    ->join('metrics.dim_estado', 'metrics.fact_incidencias.estado_id', '=', 'metrics.dim_estado.id')
                    ->where('metrics.fact_incidencias.usuario_reporta_id', $user->id)
                    ->where('metrics.dim_estado.nombre', 'Resuelto')
                    ->count(),
            ];

            $data['distribucion_estado'] = DB::table('metrics.fact_incidencias')
                ->where('usuario_reporta_id', $user->id)
                ->join('metrics.dim_estado', 'metrics.fact_incidencias.estado_id', '=', 'metrics.dim_estado.id')
                ->select('metrics.dim_estado.nombre as metric', DB::raw('COUNT(metrics.fact_incidencias.id) as value'))
                ->groupBy('metrics.dim_estado.nombre')
                ->orderByDesc('value')
                ->get();

            $data['distribucion_prioridad'] = DB::table('metrics.fact_incidencias')
                ->where('usuario_reporta_id', $user->id)
                ->join('metrics.dim_prioridad', 'metrics.fact_incidencias.prioridad_id', '=', 'metrics.dim_prioridad.id')
                ->select('metrics.dim_prioridad.nombre as metric', DB::raw('COUNT(metrics.fact_incidencias.id) as value'))
                ->groupBy('metrics.dim_prioridad.nombre')
                ->orderByDesc('value')
                ->get();

            $data['tendencia_temporal'] = DB::table('metrics.fact_incidencias')
                ->where('usuario_reporta_id', $user->id)
                ->join('metrics.dim_tiempo', 'metrics.fact_incidencias.tiempo_id', '=', 'metrics.dim_tiempo.id')
                ->select(DB::raw('DATE(metrics.dim_tiempo.fecha) as metric'), DB::raw('COUNT(metrics.fact_incidencias.id) as value'))
                ->where('metrics.dim_tiempo.fecha', '>=', $startOfRange)
                ->groupBy(DB::raw('DATE(metrics.dim_tiempo.fecha)'))
                ->orderBy('metric', 'ASC')
                ->get();

        } elseif ($role === 'Institucion') {
            $institucionId = $user->institucion_id;

            $data['kpis'] = [
                'asignadas' => DB::table('metrics.fact_incidencias')->where('institucion_id', $institucionId)->count(),
                'en_proceso' => DB::table('metrics.fact_incidencias')
                    ->join('metrics.dim_estado', 'metrics.fact_incidencias.estado_id', '=', 'metrics.dim_estado.id')
                    ->where('institucion_id', $institucionId)
                    ->where('metrics.dim_estado.nombre', 'En Proceso')
                    ->count(),
                'resueltas' => DB::table('metrics.fact_incidencias')
                    ->join('metrics.dim_estado', 'metrics.fact_incidencias.estado_id', '=', 'metrics.dim_estado.id')
                    ->where('institucion_id', $institucionId)
                    ->where('metrics.dim_estado.nombre', 'Resuelto')
                    ->count(),
            ];

            $data['distribucion_estado'] = DB::table('metrics.fact_incidencias')
                ->where('institucion_id', $institucionId)
                ->join('metrics.dim_estado', 'metrics.fact_incidencias.estado_id', '=', 'metrics.dim_estado.id')
                ->select('metrics.dim_estado.nombre as metric', DB::raw('COUNT(metrics.fact_incidencias.id) as value'))
                ->groupBy('metrics.dim_estado.nombre')
                ->orderByDesc('value')
                ->get();

            $data['tendencia_temporal'] = DB::table('metrics.fact_incidencias')
                ->where('institucion_id', $institucionId)
                ->join('metrics.dim_tiempo', 'metrics.fact_incidencias.tiempo_id', '=', 'metrics.dim_tiempo.id')
                ->select(DB::raw('DATE(metrics.dim_tiempo.fecha) as metric'), DB::raw('COUNT(metrics.fact_incidencias.id) as value'))
                ->where('metrics.dim_tiempo.fecha', '>=', $startOfRange)
                ->groupBy(DB::raw('DATE(metrics.dim_tiempo.fecha)'))
                ->orderBy('metric', 'ASC')
                ->get();

        } elseif ($role === 'Supervisor' || $role === 'Admin') {
            $data['kpis'] = [
                'totales' => DB::table('metrics.fact_incidencias')->count(),
                'sin_asignar' => DB::table('metrics.fact_incidencias')->whereNull('institucion_id')->count(),
                'resueltas' => DB::table('metrics.fact_incidencias')
                    ->join('metrics.dim_estado', 'metrics.fact_incidencias.estado_id', '=', 'metrics.dim_estado.id')
                    ->where('metrics.dim_estado.nombre', 'Resuelto')
                    ->count(),
                'pendientes' => DB::table('metrics.fact_incidencias')
                    ->join('metrics.dim_estado', 'metrics.fact_incidencias.estado_id', '=', 'metrics.dim_estado.id')
                    ->where('metrics.dim_estado.nombre', 'Pendiente')
                    ->count(),
            ];

            $data['distribucion_estado'] = DB::table('metrics.fact_incidencias')
                ->join('metrics.dim_estado', 'metrics.fact_incidencias.estado_id', '=', 'metrics.dim_estado.id')
                ->select('metrics.dim_estado.nombre as metric', DB::raw('COUNT(metrics.fact_incidencias.id) as value'))
                ->groupBy('metrics.dim_estado.nombre')
                ->orderByDesc('value')
                ->get();

            $data['incidencias_institucion'] = DB::table('metrics.fact_incidencias')
                ->leftJoin('metrics.dim_institucion', 'metrics.fact_incidencias.institucion_id', '=', 'metrics.dim_institucion.id')
                ->select(DB::raw('COALESCE(metrics.dim_institucion.nombre, \'Sin Asignar\') as metric'), DB::raw('COUNT(metrics.fact_incidencias.id) as value'))
                ->groupBy('metrics.dim_institucion.nombre')
                ->orderByDesc('value')
                ->get();

            $data['tendencia_temporal'] = DB::table('metrics.fact_incidencias')
                ->join('metrics.dim_tiempo', 'metrics.fact_incidencias.tiempo_id', '=', 'metrics.dim_tiempo.id')
                ->select(DB::raw('DATE(metrics.dim_tiempo.fecha) as metric'), DB::raw('COUNT(metrics.fact_incidencias.id) as value'))
                ->where('metrics.dim_tiempo.fecha', '>=', $startOfRange)
                ->groupBy(DB::raw('DATE(metrics.dim_tiempo.fecha)'))
                ->orderBy('metric', 'ASC')
                ->get();
        }

        return response()->json($data);
    }
}
