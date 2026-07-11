<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use SimpleXMLElement;

class CalculateCf extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sqa:cf {--xml=tests/results.xml}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calcula la Cobertura Funcional (CF) basándose en historias de usuario y tests BDD (Gherkin)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando cálculo de Cobertura Funcional (CF)...');

        // 1. Extraer universo de HUs desde Markdown
        $husDelSistema = $this->extractHUsFromMarkdown();
        if (empty($husDelSistema)) {
            $this->error('No se encontraron Historias de Usuario en el archivo docs/01_analisis/historias_usuario.md');

            return 1;
        }
        $this->info('Total de HUs definidas en el documento: '.count($husDelSistema));

        // 2. Escanear tests para mapear @group HU-XX a métodos
        $testMappings = $this->extractTestMappings();

        // 3. Leer reporte XML de PHPUnit
        $xmlPath = base_path($this->option('xml'));
        if (! File::exists($xmlPath)) {
            $this->error("No se encontró el reporte XML en: {$xmlPath}. Ejecuta: php artisan test --log-junit tests/results.xml");

            return 1;
        }

        $xml = simplexml_load_file($xmlPath);
        if ($xml === false || ! isset($xml->testsuite[0])) {
            $this->error('Formato XML no válido.');

            return 1;
        }

        // Parsear resultados XML para saber qué testcases pasaron y cuáles fallaron
        $testResults = $this->parseXmlTestResults($xml);

        // 4. Calcular CF
        $husCubiertas = 0;
        $detalleHUs = [];

        foreach ($husDelSistema as $huId => $huName) {
            // Verificar si hay tests mapeados a esta HU
            if (! isset($testMappings[$huId]) || empty($testMappings[$huId])) {
                $detalleHUs[] = [
                    'id' => $huId,
                    'nombre' => $huName,
                    'estado' => 'No Cubierta (Sin tests)',
                    'aprobada' => false,
                ];

                continue;
            }

            // Validar todos los tests de esta HU
            $huAprobada = true;
            $testsDeHu = $testMappings[$huId];
            $motivoFallo = null;

            foreach ($testsDeHu as $testName) {
                // Si el test no está en los resultados (no se ejecutó) o no aprobó
                if (! isset($testResults[$testName])) {
                    $huAprobada = false;
                    $motivoFallo = "Test no ejecutado o no encontrado en XML: {$testName}";
                    break;
                }

                if (! $testResults[$testName]['passed']) {
                    $huAprobada = false;
                    $motivoFallo = "Test falló: {$testName}";
                    break;
                }
            }

            if ($huAprobada) {
                $husCubiertas++;
                $detalleHUs[] = [
                    'id' => $huId,
                    'nombre' => $huName,
                    'estado' => 'Cubierta y Aprobada',
                    'aprobada' => true,
                ];
            } else {
                $detalleHUs[] = [
                    'id' => $huId,
                    'nombre' => $huName,
                    'estado' => 'Falla ('.$motivoFallo.')',
                    'aprobada' => false,
                ];
            }
        }

        // 5. Cálculo Final y Exportación
        $totalHus = count($husDelSistema);
        $cf = $totalHus > 0 ? ($husCubiertas / $totalHus) * 100 : 0;
        $cfFormatted = number_format($cf, 2);

        $this->comment("\n==========================================");
        $this->comment(' RESULTADO DE COBERTURA FUNCIONAL (CF)');
        $this->comment('==========================================');
        $this->info("HUs Aprobadas: {$husCubiertas} de {$totalHus}");
        $this->info("Porcentaje (CF): {$cfFormatted}%");
        $this->comment('==========================================');

        // Debug info para el log de la terminal
        foreach ($detalleHUs as $info) {
            $id = $info['id'];
            if ($info['aprobada']) {
                $this->info("[✔] {$id}: {$info['estado']}");
            } else {
                $this->error("[x] {$id}: {$info['estado']}");
            }
        }

        // Generar artefacto JSON
        $outputDir = base_path('tests/metrics-stg/cf');
        if (! File::exists($outputDir)) {
            File::makeDirectory($outputDir, 0755, true);
        }

        $date = now()->timezone('America/Guayaquil')->format('Y-m-d-H-i');
        $outputFile = "{$outputDir}/cf-{$date}.json";

        $data = [
            'metric' => 'Cobertura Funcional (CF)',
            'value' => round($cf, 2),
            'total_hus' => $totalHus,
            'hus_cubiertas' => $husCubiertas,
            'hus_no_cubiertas' => $totalHus - $husCubiertas,
            'detalle' => $detalleHUs,
            'fecha_procesamiento' => now()->timezone('America/Guayaquil')->toDateTimeString(),
        ];

        File::put($outputFile, json_encode($data, JSON_PRETTY_PRINT));

        $this->info("\nArtefacto generado exitosamente en: tests/metrics-stg/cf/cf-{$date}.json");

        return 0;
    }

    /**
     * Extrae las Historias de Usuario (ej: HU-01) desde el markdown de requerimientos.
     */
    private function extractHUsFromMarkdown()
    {
        $markdownPath = base_path('../../docs/01_analisis/historias_usuario.md');
        if (! File::exists($markdownPath)) {
            return [];
        }

        $content = File::get($markdownPath);
        $hus = [];

        // Busca lineas como: "## HU-01: Registro de incidencia"
        preg_match_all('/^##\s*(HU-\d+):\s*(.*)$/m', $content, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $hus[$match[1]] = trim($match[2]);
        }

        return $hus;
    }

    /**
     * Escanea recursivamente tests/Feature buscando etiquetas @group HU-XX
     * Devuelve array: [ 'HU-01' => ['test_metodo_1', 'test_metodo_2'] ]
     */
    private function extractTestMappings()
    {
        $testsPath = base_path('tests/Feature');
        $files = File::allFiles($testsPath);

        $mappings = [];

        foreach ($files as $file) {
            if ($file->getExtension() !== 'php') {
                continue;
            }

            $content = file_get_contents($file->getRealPath());

            // Usamos parser simple para extraer los bloques de comentarios y el método que le sigue
            preg_match_all('/\/\*\*([\s\S]*?)\*\/\s*public\s+function\s+(test_[a-zA-Z0-9_]+)/', $content, $matches, PREG_SET_ORDER);

            foreach ($matches as $match) {
                $docBlock = $match[1];
                $methodName = $match[2];

                // Buscar @group HU-XX en el docBlock
                if (preg_match('/@group\s+(HU-\d+)/', $docBlock, $groupMatch)) {
                    $huId = $groupMatch[1];
                    if (! isset($mappings[$huId])) {
                        $mappings[$huId] = [];
                    }
                    $mappings[$huId][] = $methodName;
                }
            }
        }

        return $mappings;
    }

    /**
     * Parsea el XML de JUnit y extrae el estado de cada testcase por nombre de método.
     */
    private function parseXmlTestResults(SimpleXMLElement $xml)
    {
        $results = [];
        // testcases pueden estar anidados en múltiples testsuites
        $testcases = $xml->xpath('//testcase');

        foreach ($testcases as $case) {
            $name = (string) $case['name'];

            $hasFailure = isset($case->failure);
            $hasError = isset($case->error);

            $results[$name] = [
                'passed' => (! $hasFailure && ! $hasError),
            ];
        }

        return $results;
    }
}
