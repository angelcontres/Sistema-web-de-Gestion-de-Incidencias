<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CalculateTep extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sqa:tep {--file=tests/results.xml}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calcula la Tasa de Éxito de Pruebas (TEP) a partir del XML de PHPUnit y genera un archivo JSON para Grafana';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $filePath = base_path($this->option('file'));

        if (! File::exists($filePath)) {
            $this->error("No se encontró el reporte XML en: {$filePath}. Ejecuta primero: php artisan test --log-junit tests/results.xml");

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

        // Crear directorio si no existe
        $outputDir = base_path('tests/metrics-stg/tep/');
        if (! File::exists($outputDir)) {
            File::makeDirectory($outputDir, 0755, true);
        }

        // Generar archivo JSON con la fecha actual en la zona horaria de Ecuador (America/Guayaquil)
        $date = now()->timezone('America/Guayaquil')->format('Y-m-d-H-i');
        $outputFile = "{$outputDir}/tep-{$date}.json";

        $data = [
            'metric' => 'Tasa de Exito de Pruebas (TEP)',
            'value' => round($tep, 2),
            'total_pruebas' => $totalPruebas,
            'pruebas_aprobadas' => $aprobadas,
            'pruebas_fallidas' => $fallas + $errores,
            'pruebas_omitidas' => $omitidas,
            'fecha_procesamiento' => now()->timezone('America/Guayaquil')->toDateTimeString(),
        ];

        File::put($outputFile, json_encode($data, JSON_PRETTY_PRINT));

        $this->info("\nArtefacto generado exitosamente en: tests/metrics-stg/tep/tep-{$date}.json");

        return 0;
    }
}
