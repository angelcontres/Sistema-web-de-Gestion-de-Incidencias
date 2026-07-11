<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CalculateDd extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sqa:dd {--path=../../} {--months=3}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calcula la Densidad de Defectos (DD) usando cloc y git log';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $path = $this->option('path');
        // El parámetro months ahora se usa como límite superior opcional, pero pre-calcularemos varios rangos
        $maxMonths = intval($this->option('months'));

        $targetPath = realpath(base_path($path));

        if (!$targetPath || !File::isDirectory($targetPath)) {
            $this->error("La ruta especificada ({$path}) no es válida o no existe.");
            return 1;
        }

        // 1. Verificación de dependencias
        $this->info("Verificando dependencias...");
        if (!$this->checkDependency('cloc --version')) {
            $this->error("Error: 'cloc' no está instalado. Por favor instálalo (ej. npm install -g cloc o descarga el ejecutable) para extraer esta métrica.");
            return 1;
        }

        if (!$this->checkDependency('git --version')) {
            $this->error("Error: 'git' no está instalado o no está en el PATH del sistema.");
            return 1;
        }

        // 2. Leer exclusiones desde el archivo .clocignore en la raíz del proyecto
        $clocignorePath = $targetPath . DIRECTORY_SEPARATOR . '.clocignore';
        $directoriesToExclude = [];
        $filesToExclude = [];
        
        if (File::exists($clocignorePath)) {
            $lines = file($clocignorePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (!empty($line) && strpos($line, '#') !== 0) { // ignorar comentarios
                    $fullPath = $targetPath . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $line);
                    $basename = basename($line);
                    
                    if (File::isDirectory($fullPath)) {
                        if (!in_array($basename, $directoriesToExclude)) {
                            $directoriesToExclude[] = $basename;
                        }
                    } else {
                        // Si es archivo o no existe actualmente pero tiene pinta de archivo, lo excluimos como archivo
                        if (!in_array($basename, $filesToExclude)) {
                            $filesToExclude[] = $basename;
                        }
                    }
                }
            }
        }
        
        // Fallback por defecto si no existe el archivo
        if (empty($directoriesToExclude) && empty($filesToExclude)) {
            $directoriesToExclude = ['vendor', 'node_modules', 'storage', 'cache', 'public', 'metrics-stg', 'raw-results', '.git', '.github', '.vscode', 'grafana', 'cloudflare', 'docs'];
        }

        // 3. Proceso KLOC
        $this->info("Calculando Líneas de Código (KLOC) excluyendo código de terceros...");

        $clocCommand = "cloc " . escapeshellarg($targetPath);
        
        if (!empty($directoriesToExclude)) {
            $clocCommand .= " --exclude-dir=" . escapeshellarg(implode(',', $directoriesToExclude));
        }
        
        if (!empty($filesToExclude)) {
            $escapedFiles = array_map(function($file) {
                return preg_quote($file, '/');
            }, $filesToExclude);
            $regex = '^(' . implode('|', $escapedFiles) . ')$';
            $clocCommand .= " --not-match-f=" . escapeshellarg($regex);
        }
        
        $clocCommand .= " --json";
        $clocOutput = shell_exec($clocCommand);

        $clocData = json_decode($clocOutput, true);
        if (!$clocData || !isset($clocData['SUM']['code'])) {
            $this->error("No se pudo parsear el resultado de cloc. Verifica que cloc esté funcionando correctamente.");
            return 1;
        }

        $totalLines = $clocData['SUM']['code'];
        $kloc = $totalLines / 1000;

        // 4. Proceso Defectos (Git) iterando por varios rangos de meses para Grafana
        $this->info("Analizando el historial de Git buscando defectos...");

        $historicalData = [];
        $monthRanges = [1, 2, 3, 6, 12, 24]; // Pre-calculamos estos rangos comunes para filtros en Grafana

        if (!in_array($maxMonths, $monthRanges)) {
            $monthRanges[] = $maxMonths; // Incluir el solicitado por comando si no está
            sort($monthRanges);
        }

        foreach ($monthRanges as $m) {
            $gitCommand = "git -C " . escapeshellarg($targetPath) . " rev-list --since=\"{$m} months ago\" --grep=\"fix\" --grep=\"bug\" --grep=\"corregido\" --grep=\"error\" --grep=\"hotfix\" -i HEAD --count";
            $gitOutput = shell_exec($gitCommand);
            $defectos = intval(trim($gitOutput));
            $dd = $kloc > 0 ? ($defectos / $kloc) : 0;

            $historicalData[] = [
                'months' => $m,
                'defectos' => $defectos,
                'dd' => round($dd, 2)
            ];

            // Para mostrar en consola solo el valor principal (el solicitado por $maxMonths)
            if ($m === $maxMonths) {
                $mainDefectos = $defectos;
                $mainDdFormatted = number_format($dd, 2);
            }
        }

        $this->comment("\n==========================================");
        $this->comment(" RESULTADO DE DENSIDAD DE DEFECTOS (DD)");
        $this->comment("==========================================");
        $this->info("Líneas de Código (KLOC): " . number_format($kloc, 3));
        $this->info("Defectos Encontrados (últimos {$maxMonths} meses): {$mainDefectos}");
        $this->info("Densidad de Defectos: {$mainDdFormatted} defectos por KLOC");
        $this->comment("==========================================");

        // 6. Generar JSON
        $outputDir = base_path('tests/metrics-stg/dd/');
        if (!File::exists($outputDir)) {
            File::makeDirectory($outputDir, 0755, true);
        }

        $date = now()->timezone('America/Guayaquil')->format('Y-m-d');
        $outputFile = "{$outputDir}dd-{$date}.json";

        $data = [
            'metric' => 'Densidad de Defectos (DD)',
            'kloc' => round($kloc, 3),
            'total_lines' => $totalLines,
            'historical_data' => $historicalData, // Grafana filtrará este array usando JSONata: $.historical_data[?(@.months==$rango)].dd
            'fecha_procesamiento' => now()->timezone('America/Guayaquil')->toDateTimeString(),
        ];

        File::put($outputFile, json_encode($data, JSON_PRETTY_PRINT));

        $this->info("\nArtefacto generado exitosamente en: tests/metrics-stg/dd/dd-{$date}.json");

        return 0;
    }

    /**
     * Verifica si un comando está disponible en el sistema.
     *
     * @param string $command
     * @return bool
     */
    private function checkDependency($command)
    {
        // Redirigir STDERR a STDOUT para capturar errores de comando no encontrado
        $output = shell_exec($command . ' 2>&1');

        if ($output === null) {
            return false;
        }

        $outputLower = strtolower($output);

        if (strpos($outputLower, 'not recognized') !== false ||
            strpos($outputLower, 'no se reconoce') !== false ||
            strpos($outputLower, 'not found') !== false) {
            return false;
        }

        return true;
    }
}
