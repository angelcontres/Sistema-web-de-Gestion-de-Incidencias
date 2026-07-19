<?php

namespace App\Jobs\Etl;

use App\Services\TimezoneService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class SyncPerformanceLogsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        // 1. Sincronizar endpoints a dim_endpoint
        $endpoints = DB::table('performance_logs')
            ->select('endpoint as path', 'metodo')
            ->distinct()
            ->get();

        foreach ($endpoints as $e) {
            DB::table('metrics.dim_endpoint')->updateOrInsert(
                ['path' => $e->path, 'metodo' => $e->metodo],
                ['updated_at' => now(), 'created_at' => now()]
            );
        }

        // Obtener mapa de endpoints
        $endpointMap = DB::table('metrics.dim_endpoint')
            ->select('id', 'path', 'metodo')
            ->get()
            ->mapWithKeys(function ($item) {
                return ["{$item->path}.{$item->metodo}" => $item->id];
            });

        // 2. Sincronizar logs hacia fact_performance
        $logs = DB::table('performance_logs')->get();
        $records = [];

        foreach ($logs as $log) {
            $key = "{$log->endpoint}.{$log->metodo}";
            $endpointId = $endpointMap[$key] ?? null;

            if (! $endpointId) {
                continue;
            }

            $loggedAt = TimezoneService::toLocal($log->logged_at);
            $tiempoId = (int) $loggedAt->format('YmdH');

            $this->ensureTiempoIdExists($tiempoId, $loggedAt);

            $records[] = [
                'id' => $log->id,
                'tiempo_id' => $tiempoId,
                'endpoint_id' => $endpointId,
                'usuario_id' => $log->usuario_id ?? null,
                'trp' => $log->trp,
                'status_code' => 200, // Por defecto en el middleware original no se guardaba
                'logged_at' => $log->logged_at,
                'created_at' => $log->created_at ?? now(),
                'updated_at' => $log->updated_at ?? now(),
            ];

            if (count($records) >= 500) {
                DB::table('metrics.fact_performance')->upsert(
                    $records,
                    ['id'],
                    ['tiempo_id', 'endpoint_id', 'usuario_id', 'trp', 'status_code', 'logged_at', 'updated_at']
                );
                $records = [];
            }
        }

        if (! empty($records)) {
            DB::table('metrics.fact_performance')->upsert(
                $records,
                ['id'],
                ['tiempo_id', 'endpoint_id', 'usuario_id', 'trp', 'status_code', 'logged_at', 'updated_at']
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
