<?php

namespace App\Jobs\Etl;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;

class LoadSqaMetricsFromJsonJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $this->loadTepMetrics();
        $this->loadVcoMetrics();
        $this->loadCfMetrics();
        $this->loadDdMetrics();
    }

    private function ensureTiempoIdExists(int $tiempoId, Carbon $date): void
    {
        $exists = DB::table('metrics.dim_tiempo')->where('id', $tiempoId)->exists();
        if (!$exists) {
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

    private function loadTepMetrics(): void
    {
        $dir = base_path('tests/metrics-stg/tep');
        if (!File::exists($dir)) return;

        $files = File::files($dir);
        foreach ($files as $file) {
            if ($file->getExtension() !== 'json') continue;

            $data = json_decode(File::get($file->getRealPath()), true);
            if (!$data) continue;

            $dateStr = $data['fecha_procesamiento'];
            $date = Carbon::parse($dateStr);
            $tiempoId = (int)$date->format('YmdH');

            $this->ensureTiempoIdExists($tiempoId, $date);

            DB::table('metrics.fact_testing')->updateOrInsert(
                ['tiempo_id' => $tiempoId],
                [
                    'total_pruebas' => $data['total_pruebas'],
                    'pruebas_aprobadas' => $data['pruebas_aprobadas'],
                    'pruebas_fallidas' => $data['pruebas_fallidas'],
                    'pruebas_omitidas' => $data['pruebas_omitidas'],
                    'tep' => $data['value'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }

    private function loadVcoMetrics(): void
    {
        $dir = base_path('tests/metrics-stg/vco');
        if (!File::exists($dir)) return;

        $files = File::files($dir);
        foreach ($files as $file) {
            if ($file->getExtension() !== 'json') continue;

            $data = json_decode(File::get($file->getRealPath()), true);
            if (!$data) continue;

            $dateStr = $data['fecha_procesamiento'];
            $date = Carbon::parse($dateStr);
            $tiempoId = (int)$date->format('YmdH');

            $this->ensureTiempoIdExists($tiempoId, $date);

            $sevs = $data['resumen_severidades'] ?? [];

            DB::table('metrics.fact_security')->updateOrInsert(
                ['tiempo_id' => $tiempoId],
                [
                    'vulnerabilidades_criticas' => $sevs['critical'] ?? 0,
                    'vulnerabilidades_altas' => $sevs['high'] ?? 0,
                    'vulnerabilidades_medias' => $sevs['medium'] ?? 0,
                    'vulnerabilidades_bajas' => $sevs['low'] ?? 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }

    private function loadCfMetrics(): void
    {
        $dir = base_path('tests/metrics-stg/cf');
        if (!File::exists($dir)) return;

        $files = File::files($dir);
        foreach ($files as $file) {
            if ($file->getExtension() !== 'json') continue;

            $data = json_decode(File::get($file->getRealPath()), true);
            if (!$data) continue;

            $dateStr = $data['fecha_procesamiento'];
            $date = Carbon::parse($dateStr);
            $tiempoId = (int)$date->format('YmdH');

            $this->ensureTiempoIdExists($tiempoId, $date);

            DB::table('metrics.fact_quality')->updateOrInsert(
                ['tiempo_id' => $tiempoId, 'metric_id' => 1], // metric_id = 1 Cobertura Funcional
                [
                    'valor_porcentaje' => $data['value'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }

    private function loadDdMetrics(): void
    {
        $dir = base_path('tests/metrics-stg/dd');
        if (!File::exists($dir)) return;

        $files = File::files($dir);
        foreach ($files as $file) {
            if ($file->getExtension() !== 'json') continue;

            $data = json_decode(File::get($file->getRealPath()), true);
            if (!$data) continue;

            $dateStr = $data['fecha_procesamiento'];
            $date = Carbon::parse($dateStr);
            $tiempoId = (int)$date->format('YmdH');

            $this->ensureTiempoIdExists($tiempoId, $date);

            DB::table('metrics.fact_quality')->updateOrInsert(
                ['tiempo_id' => $tiempoId, 'metric_id' => 3], // metric_id = 3 Densidad de Defectos
                [
                    'valor_porcentaje' => $data['value'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
