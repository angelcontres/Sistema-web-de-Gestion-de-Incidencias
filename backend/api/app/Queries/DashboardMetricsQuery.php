<?php

namespace App\Queries;

use App\Services\TimezoneService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardMetricsQuery
{
    private const COUNT_INCIDENCIAS = 'COUNT(metrics.fact_incidencias.id) as value';
    private const ESTADO_NOMBRE_METRIC = 'metrics.dim_estado.nombre as metric';
    private const DATE_TRUNC_HOUR_METRIC = "DATE_TRUNC('hour', metrics.dim_tiempo.fecha) as metric";
    private const DATE_TRUNC_HOUR = "DATE_TRUNC('hour', metrics.dim_tiempo.fecha)";

    public function getMetrics($role, $user)
    {
        $cacheKey = 'dashboard_metrics_'.$role.'_'.($user ? $user->id : 'guest');

        return Cache::remember($cacheKey, now()->addMinutes(15), function () use ($role, $user) {
            $now = TimezoneService::nowLocal()->setTimezone('UTC');
            $startOfRange = $now->copy()->subHours(24);
            $data = [];

            if ($role === 'Ciudadano') {
                $data['kpis'] = [
                    'mis_reportes' => DB::table('metrics.fact_incidencias')
                        ->where('usuario_reporta_id', $user->id)
                        ->count(),
                    'solucionados' => DB::table('metrics.fact_incidencias')
                        ->join(
                            'metrics.dim_estado',
                            'metrics.fact_incidencias.estado_id',
                            '=',
                            'metrics.dim_estado.id'
                        )
                        ->where('metrics.fact_incidencias.usuario_reporta_id', $user->id)
                        ->where('metrics.dim_estado.nombre', 'Resuelto')
                        ->count(),
                ];

                $data['distribucion_estado'] = DB::table('metrics.fact_incidencias')
                    ->where('usuario_reporta_id', $user->id)
                    ->join(
                        'metrics.dim_estado',
                        'metrics.fact_incidencias.estado_id',
                        '=',
                        'metrics.dim_estado.id'
                    )
                    ->select(self::ESTADO_NOMBRE_METRIC, DB::raw(self::COUNT_INCIDENCIAS))
                    ->groupBy('metrics.dim_estado.nombre')
                    ->orderByDesc('value')
                    ->get();

                $data['distribucion_prioridad'] = DB::table('metrics.fact_incidencias')
                    ->where('usuario_reporta_id', $user->id)
                    ->join(
                        'metrics.dim_prioridad',
                        'metrics.fact_incidencias.prioridad_id',
                        '=',
                        'metrics.dim_prioridad.id'
                    )
                    ->select('metrics.dim_prioridad.nombre as metric', DB::raw(self::COUNT_INCIDENCIAS))
                    ->groupBy('metrics.dim_prioridad.nombre')
                    ->orderByDesc('value')
                    ->get();

                $data['tendencia_temporal'] = DB::table('metrics.fact_incidencias')
                    ->where('usuario_reporta_id', $user->id)
                    ->join(
                        'metrics.dim_tiempo',
                        'metrics.fact_incidencias.tiempo_id',
                        '=',
                        'metrics.dim_tiempo.id'
                    )
                    ->select(DB::raw(self::DATE_TRUNC_HOUR_METRIC), DB::raw(self::COUNT_INCIDENCIAS))
                    ->where('metrics.dim_tiempo.fecha', '>=', $startOfRange)
                    ->groupBy(DB::raw(self::DATE_TRUNC_HOUR))
                    ->orderBy('metric', 'ASC')
                    ->get();

            } elseif ($role === 'Institucion') {
                $institucionId = $user->institucion_id;

                $data['kpis'] = [
                    'asignadas' => DB::table('metrics.fact_incidencias')
                        ->where('institucion_id', $institucionId)
                        ->count(),
                    'en_proceso' => DB::table('metrics.fact_incidencias')
                        ->join(
                            'metrics.dim_estado',
                            'metrics.fact_incidencias.estado_id',
                            '=',
                            'metrics.dim_estado.id'
                        )
                        ->where('institucion_id', $institucionId)
                        ->where('metrics.dim_estado.nombre', 'En Proceso')
                        ->count(),
                    'resueltas' => DB::table('metrics.fact_incidencias')
                        ->join(
                            'metrics.dim_estado',
                            'metrics.fact_incidencias.estado_id',
                            '=',
                            'metrics.dim_estado.id'
                        )
                        ->where('institucion_id', $institucionId)
                        ->where('metrics.dim_estado.nombre', 'Resuelto')
                        ->count(),
                ];

                $data['distribucion_estado'] = DB::table('metrics.fact_incidencias')
                    ->where('institucion_id', $institucionId)
                    ->join(
                        'metrics.dim_estado',
                        'metrics.fact_incidencias.estado_id',
                        '=',
                        'metrics.dim_estado.id'
                    )
                    ->select(self::ESTADO_NOMBRE_METRIC, DB::raw(self::COUNT_INCIDENCIAS))
                    ->groupBy('metrics.dim_estado.nombre')
                    ->orderByDesc('value')
                    ->get();

                $data['tendencia_temporal'] = DB::table('metrics.fact_incidencias')
                    ->where('institucion_id', $institucionId)
                    ->join(
                        'metrics.dim_tiempo',
                        'metrics.fact_incidencias.tiempo_id',
                        '=',
                        'metrics.dim_tiempo.id'
                    )
                    ->select(DB::raw(self::DATE_TRUNC_HOUR_METRIC), DB::raw(self::COUNT_INCIDENCIAS))
                    ->where('metrics.dim_tiempo.fecha', '>=', $startOfRange)
                    ->groupBy(DB::raw(self::DATE_TRUNC_HOUR))
                    ->orderBy('metric', 'ASC')
                    ->get();

            } elseif ($role === 'Supervisor' || $role === 'Admin') {
                $data['kpis'] = [
                    'totales' => DB::table('metrics.fact_incidencias')->count(),
                    'sin_asignar' => DB::table('metrics.fact_incidencias')->whereNull('institucion_id')->count(),
                    'resueltas' => DB::table('metrics.fact_incidencias')
                        ->join(
                            'metrics.dim_estado',
                            'metrics.fact_incidencias.estado_id',
                            '=',
                            'metrics.dim_estado.id'
                        )
                        ->where('metrics.dim_estado.nombre', 'Resuelto')
                        ->count(),
                    'pendientes' => DB::table('metrics.fact_incidencias')
                        ->join(
                            'metrics.dim_estado',
                            'metrics.fact_incidencias.estado_id',
                            '=',
                            'metrics.dim_estado.id'
                        )
                        ->where('metrics.dim_estado.nombre', 'Pendiente')
                        ->count(),
                ];

                $data['distribucion_estado'] = DB::table('metrics.fact_incidencias')
                    ->join(
                        'metrics.dim_estado',
                        'metrics.fact_incidencias.estado_id',
                        '=',
                        'metrics.dim_estado.id'
                    )
                    ->select(self::ESTADO_NOMBRE_METRIC, DB::raw(self::COUNT_INCIDENCIAS))
                    ->groupBy('metrics.dim_estado.nombre')
                    ->orderByDesc('value')
                    ->get();

                $data['incidencias_institucion'] = DB::table('metrics.fact_incidencias')
                    ->leftJoin(
                        'metrics.dim_institucion',
                        'metrics.fact_incidencias.institucion_id',
                        '=',
                        'metrics.dim_institucion.id'
                    )
                    ->select(
                        DB::raw("COALESCE(metrics.dim_institucion.nombre, 'Sin Asignar') as metric"),
                        DB::raw(self::COUNT_INCIDENCIAS)
                    )
                    ->groupBy('metrics.dim_institucion.nombre')
                    ->orderByDesc('value')
                    ->get();

                $data['tendencia_temporal'] = DB::table('metrics.fact_incidencias')
                    ->join(
                        'metrics.dim_tiempo',
                        'metrics.fact_incidencias.tiempo_id',
                        '=',
                        'metrics.dim_tiempo.id'
                    )
                    ->select(DB::raw(self::DATE_TRUNC_HOUR_METRIC), DB::raw(self::COUNT_INCIDENCIAS))
                    ->where('metrics.dim_tiempo.fecha', '>=', $startOfRange)
                    ->groupBy(DB::raw(self::DATE_TRUNC_HOUR))
                    ->orderBy('metric', 'ASC')
                    ->get();
            }

            // Aseguramos que todo sea un array puro para evitar problemas de serialización en el caché
            $data['distribucion_estado'] = json_decode(json_encode($data['distribucion_estado'] ?? []), true);
            if (isset($data['distribucion_prioridad'])) {
                $data['distribucion_prioridad'] = json_decode(json_encode($data['distribucion_prioridad']), true);
            }
            if (isset($data['tendencia_temporal'])) {
                $data['tendencia_temporal'] = json_decode(json_encode($data['tendencia_temporal']), true);
            }
            if (isset($data['incidencias_institucion'])) {
                $data['incidencias_institucion'] = json_decode(json_encode($data['incidencias_institucion']), true);
            }

            return $data;
        });
    }
}
