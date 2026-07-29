<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

#[Signature('sqa:tep {--file=tests/results.xml}')]
#[Description(
    'Calcula la Tasa de Éxito de Pruebas (TEP) a partir del XML de PHPUnit ' .
    'y genera un archivo JSON para Grafana'
)]
class CalculateTep extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $filePath = base_path($this->option('file'));

        if (! File::exists($filePath)) {
            $this->error(
                "No se encontró el reporte XML en: {$filePath}. " .
                "Ejecuta primero: php artisan test --log-junit tests/results.xml"
            );

            return 1;
        }

        $this->info("Procesando reporte de pruebas: {$filePath}");
        $xml = simplexml_load_file($filePath);

        if ($xml === false || ! isset($xml->testsuite[0])) {
            $this->error('El archivo XML no tiene un formato válido de JUnit.');

            return 1;
        }

        $mainSuite = $xml->testsuite[0];

        $totalPruebas = (int) $mainSuite['tests'];
        $errores = (int) $mainSuite['errors'];
        $fallas = (int) $mainSuite['failures'];
        $omitidas = (int) $mainSuite['skipped'];

        $aprobadas = $totalPruebas - $errores - $fallas - $omitidas;

        $tep = $totalPruebas > 0 ? ($aprobadas / $totalPruebas) * 100 : 0;

        $tepFormatted = number_format($tep, 2);

        $this->comment("\n==========================================");
        $this->comment(' RESULTADO DE TASA DE ÉXITO DE PRUEBAS (TEP)');
        $this->comment('==========================================');
        $this->info("Pruebas Aprobadas: {$aprobadas} de {$totalPruebas}");
        $this->info('Fallas/Errores: '.($fallas + $errores));
        $this->info("Omitidas: {$omitidas}");
        $this->info("Tasa de Éxito (TEP): {$tepFormatted}%");
        $this->comment('==========================================');

        // Guardar en esquema analítico OLAP
        $now = now()->timezone('America/Guayaquil');
        $tiempoId = (int) $now->format('YmdH');

        // Asegurar que la dimensión tiempo exista
        DB::table('metrics.dim_tiempo')->updateOrInsert(
            ['id' => $tiempoId],
            [
                'fecha' => $now->toDateTimeString(),
                'anio' => $now->year,
                'mes' => $now->month,
                'dia' => $now->day,
                'hora' => $now->hour,
                'trimestre' => ceil($now->month / 3),
                'dia_semana' => $now->format('l'),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // Insertar en la tabla de hechos de testing
        DB::table('metrics.fact_testing')->insert([
            'tiempo_id' => $tiempoId,
            'total_pruebas' => $totalPruebas,
            'pruebas_aprobadas' => $aprobadas,
            'pruebas_fallidas' => $fallas + $errores,
            'pruebas_omitidas' => $omitidas,
            'tep' => round($tep, 2),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->info(
            "\nMétrica de Tasa de Éxito de Pruebas (TEP) guardada exitosamente " .
            "en el esquema OLAP (fact_testing)."
        );

        return 0;
    }
}
