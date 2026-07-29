<?php

namespace App\Jobs\Etl;

use App\Models\EstadoIncidencia;
use App\Services\TimezoneService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class SyncFactIncidenciasJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $enRevisionId = EstadoIncidencia::where('nombre', 'En Revisión')->value('id') ?? 2;
        $enProcesoId = EstadoIncidencia::where('nombre', 'En Proceso')->value('id') ?? 3;
        $resueltoId = EstadoIncidencia::where('nombre', 'Resuelto')->value('id') ?? 4;

        // 1. Obtener todas las incidencias operacionales
        $incidencias = DB::table('reporte_incidencias')
            ->join('direcciones', 'reporte_incidencias.direccion_id', '=', 'direcciones.id')
            ->select(
                'reporte_incidencias.id',
                'reporte_incidencias.created_at',
                'direcciones.territorio_id',
                'direcciones.codigo_postal',
                'reporte_incidencias.tipo_incidencia_id as categoria_id',
                'reporte_incidencias.estado_id',
                'reporte_incidencias.prioridad_id',
                'reporte_incidencias.institucion_id',
                'reporte_incidencias.cliente_id as usuario_reporta_id',
                DB::raw(
                    "(SELECT usuario_id FROM historial_incidencias ".
                    "WHERE historial_incidencias.incidencia_id = reporte_incidencias.id ".
                    "AND historial_incidencias.estado_id IN ($enRevisionId, $enProcesoId) ".
                    "ORDER BY estado_id DESC, created_at ASC LIMIT 1) as usuario_asignado_id"
                )
            )
            ->get();

        // 2. Obtener el historial para calcular tiempos
        $historial = DB::table('historial_incidencias')
            ->select('incidencia_id', 'estado_id', 'created_at')
            ->orderBy('created_at', 'asc')
            ->get()
            ->groupBy('incidencia_id');

        $records = [];
        foreach ($incidencias as $inc) {
            $createdTime = TimezoneService::toLocal($inc->created_at);
            $tiempoId = (int) $createdTime->format('YmdHis');

            // Asegurarse de que el tiempo_id exista en dim_tiempo, si no, crear uno rápido
            $this->ensureTiempoIdExists($tiempoId, $createdTime);

            // Calcular tiempo de respuesta (hacia "En Proceso" - estado_id = 3)
            $tiempoRespuesta = null;
            $tiempoResolucion = null;

            if (isset($historial[$inc->id])) {
                $historialDeIncidencia = $historial[$inc->id];

                // Primer cambio a En Proceso
                $enProcesoLog = $historialDeIncidencia->firstWhere('estado_id', $enProcesoId);
                if ($enProcesoLog) {
                    $tiempoRespuesta = (int) $createdTime->diffInMinutes(
                        TimezoneService::toLocal($enProcesoLog->created_at)
                    );
                }

                // Primer cambio a Resuelto
                $resueltoLog = $historialDeIncidencia->firstWhere('estado_id', $resueltoId);
                if ($resueltoLog) {
                    $tiempoResolucion = (int) $createdTime->diffInMinutes(
                        TimezoneService::toLocal($resueltoLog->created_at)
                    );
                }
            }

            $records[] = [
                'id' => $inc->id,
                'tiempo_id' => $tiempoId,
                'territorio_id' => $inc->territorio_id,
                'categoria_id' => $inc->categoria_id,
                'estado_id' => $inc->estado_id,
                'prioridad_id' => $inc->prioridad_id,
                'institucion_id' => $inc->institucion_id,
                'usuario_reporta_id' => $inc->usuario_reporta_id,
                'usuario_asignado_id' => $inc->usuario_asignado_id,
                'cantidad' => 1,
                'codigo_postal' => $inc->codigo_postal ?: 'N/A',
                'tiempo_respuesta_minutos' => $tiempoRespuesta,
                'tiempo_resolucion_minutos' => $tiempoResolucion,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (count($records) >= 200) {
                DB::table('metrics.fact_incidencias')->upsert(
                    $records,
                    ['id'],
                    [
                        'tiempo_id', 'territorio_id', 'categoria_id', 'estado_id',
                        'prioridad_id', 'institucion_id', 'usuario_reporta_id',
                        'usuario_asignado_id', 'cantidad', 'codigo_postal',
                        'tiempo_respuesta_minutos', 'tiempo_resolucion_minutos', 'updated_at',
                    ]
                );
                $records = [];
            }
        }

        if (! empty($records)) {
            DB::table('metrics.fact_incidencias')->upsert(
                $records,
                ['id'],
                [
                    'tiempo_id', 'territorio_id', 'categoria_id', 'estado_id',
                    'prioridad_id', 'institucion_id', 'usuario_reporta_id',
                    'usuario_asignado_id', 'cantidad', 'codigo_postal',
                    'tiempo_respuesta_minutos', 'tiempo_resolucion_minutos', 'updated_at',
                ]
            );
        }
    }

    private function ensureTiempoIdExists(int $tiempoId, Carbon $date): void
    {
        $exists = DB::table('metrics.dim_tiempo')->where('id', $tiempoId)->exists();
        if (! $exists) {
            DB::table('metrics.dim_tiempo')->insert([
                'id' => $tiempoId,
                'fecha' => $date->toDateTimeString(),
                'anio' => $date->year,
                'mes' => $date->month,
                'dia' => $date->day,
                'hora' => $date->hour,
                'trimestre' => ceil($date->month / 3),
                'dia_semana' => $date->locale('es')->dayName,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
