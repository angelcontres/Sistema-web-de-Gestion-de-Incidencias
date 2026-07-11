<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CalculateVco extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sqa:vco {--path=../../}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calcula las Vulnerabilidades Críticas (OWASP) (VCO)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $path = $this->option('path');
        $targetPath = realpath(base_path($path));

        if (! $targetPath || ! File::isDirectory($targetPath)) {
            $this->error("La ruta especificada ({$path}) no es válida o no existe.");

            return 1;
        }

        $this->info('Iniciando escaneo de vulnerabilidades...');

        // 1. Auditoría de dependencias del Backend (Composer)
        $this->info("\n[1/2] Auditando dependencias del Backend (composer audit)...");
        $backendIssues = $this->auditBackend();

        // 2. Escaneo SAST (código fuente) del Frontend
        $this->info("\n[2/2] Escaneando código fuente del Frontend (SAST)...");
        $frontendPath = $targetPath.DIRECTORY_SEPARATOR.'frontend';
        $frontendIssues = $this->auditFrontend($frontendPath);

        // 3. Consolidación de Resultados
        $this->info("\nConsolidando resultados...");

        $totalCriticalHigh = 0;

        foreach ($backendIssues as $issue) {
            if (in_array(strtolower($issue['severity']), ['critical', 'high'])) {
                $totalCriticalHigh++;
            }
        }

        foreach ($frontendIssues as $issue) {
            if (in_array(strtolower($issue['severity']), ['critical', 'high'])) {
                $totalCriticalHigh++;
            }
        }

        $this->comment("\n==========================================");
        $this->comment(' RESULTADO VULNERABILIDADES CRÍTICAS (VCO)');
        $this->comment('==========================================');
        $this->info('Vulnerabilidades Backend: '.count($backendIssues));
        $this->info('Vulnerabilidades Frontend: '.count($frontendIssues));
        if ($totalCriticalHigh > 0) {
            $this->error("Total CRÍTICAS/ALTAS: {$totalCriticalHigh}");
        } else {
            $this->info("Total CRÍTICAS/ALTAS: {$totalCriticalHigh}");
        }
        $this->comment('==========================================');

        // Contar severidades y orígenes
        $severitiesSummary = [
            'critical' => 0,
            'high' => 0,
            'medium' => 0,
            'low' => 0,
        ];

        foreach ($backendIssues as $issue) {
            $sev = strtolower($issue['severity'] ?? 'unknown');
            if (isset($severitiesSummary[$sev])) {
                $severitiesSummary[$sev]++;
            }
        }

        foreach ($frontendIssues as $issue) {
            $sev = strtolower($issue['severity'] ?? 'unknown');
            if (isset($severitiesSummary[$sev])) {
                $severitiesSummary[$sev]++;
            }
        }

        // 4. Generar JSON
        $outputDir = base_path('tests/metrics-stg/vco/');
        if (! File::exists($outputDir)) {
            File::makeDirectory($outputDir, 0755, true);
        }

        $date = now()->timezone('America/Guayaquil')->format('Y-m-d-H-i');
        $outputFile = "{$outputDir}vco-{$date}.json";

        $data = [
            'metric' => 'Vulnerabilidades Criticas (OWASP) (VCO)',
            'total_critical_high' => $totalCriticalHigh,
            'resumen_origen' => [
                'backend' => count($backendIssues),
                'frontend' => count($frontendIssues),
            ],
            'resumen_severidades' => $severitiesSummary,
            'backend' => [
                'vulnerabilities' => $backendIssues,
            ],
            'frontend' => [
                'vulnerabilities' => $frontendIssues,
            ],
            'fecha_procesamiento' => now()->timezone('America/Guayaquil')->toDateTimeString(),
        ];

        File::put($outputFile, json_encode($data, JSON_PRETTY_PRINT));

        $this->info("\nArtefacto generado exitosamente en: tests/metrics-stg/vco/vco-{$date}.json");

        return 0;
    }

    private function auditBackend()
    {
        // Ejecutamos composer audit --format=json
        $command = 'composer audit --format=json 2>&1';
        $output = shell_exec($command);

        $issues = [];

        // Composer audit devuelve código de error si encuentra vulnerabilidades,
        // pero la salida debe ser un JSON válido (podría tener warnings al principio, así que buscamos el primer {)
        $jsonStart = strpos($output, '{');
        if ($jsonStart !== false) {
            $jsonString = substr($output, $jsonStart);
            $data = json_decode($jsonString, true);

            if ($data && isset($data['advisories'])) {
                foreach ($data['advisories'] as $package => $packageAdvisories) {
                    foreach ($packageAdvisories as $advisory) {
                        $issues[] = [
                            'package' => $package,
                            'title' => $advisory['title'] ?? 'Vulnerabilidad Desconocida',
                            'severity' => strtolower($advisory['severity'] ?? 'unknown'),
                            'link' => $advisory['link'] ?? '',
                        ];
                    }
                }
            }
        }

        return $issues;
    }

    private function auditFrontend($frontendPath)
    {
        $issues = [];

        if (! File::isDirectory($frontendPath)) {
            $this->warn("El directorio de frontend no existe en: {$frontendPath}");

            return $issues;
        }

        $files = File::allFiles($frontendPath);

        $rules = [
            [
                'regex' => '/\binnerHTML\s*=/i',
                'type' => 'Cross-Site Scripting (XSS)',
                'severity' => 'high',
                'description' => 'Uso de innerHTML detectado. Riesgo de XSS. Se recomienda usar textContent o createElement.',
            ],
            [
                'regex' => '/document\.write\s*\(/i',
                'type' => 'Cross-Site Scripting (XSS)',
                'severity' => 'high',
                'description' => 'Uso de document.write detectado. Riesgo de XSS y problemas de rendimiento.',
            ],
            [
                'regex' => '/\beval\s*\(/i',
                'type' => 'Ejecución Insegura (RCE)',
                'severity' => 'critical',
                'description' => 'Uso de eval() detectado. Permite ejecución arbitraria de código.',
            ],
            [
                'regex' => '/new\s+Function\s*\(/i',
                'type' => 'Ejecución Insegura (RCE)',
                'severity' => 'critical',
                'description' => 'Uso de new Function() detectado. Similar a eval, puede ejecutar código inseguro.',
            ],
            [
                'regex' => '/(api_key|apikey|password|secret|token)\s*[:=]\s*[\'"][a-zA-Z0-9\-\_]{16,}[\'"]/i',
                'type' => 'Exposición de Credenciales',
                'severity' => 'high',
                'description' => 'Posible credencial o secreto quemado en el código fuente (Hardcoded secret).',
            ],
            [
                'regex' => '/http:\/\/[a-zA-Z0-9\-\.]+/i',
                'type' => 'Protocolo Inseguro',
                'severity' => 'medium',
                'description' => 'Llamada HTTP en texto plano. Se recomienda utilizar HTTPS.',
            ],
        ];

        foreach ($files as $file) {
            // Analizar solo js y html
            $extension = strtolower($file->getExtension());
            if (! in_array($extension, ['js', 'html'])) {
                continue;
            }

            // Ignorar librerías comunes si estuvieran sueltas
            if (strpos($file->getRelativePathname(), 'node_modules') !== false || strpos($file->getFilename(), '.min.js') !== false) {
                continue;
            }

            $content = file_get_contents($file->getRealPath());
            $lines = explode("\n", $content);

            foreach ($lines as $lineNumber => $line) {
                foreach ($rules as $rule) {
                    if (preg_match($rule['regex'], $line)) {
                        $issues[] = [
                            'file' => 'frontend/'.str_replace('\\', '/', $file->getRelativePathname()),
                            'line' => $lineNumber + 1,
                            'type' => $rule['type'],
                            'severity' => $rule['severity'],
                            'description' => $rule['description'],
                            'match' => trim($line),
                        ];
                    }
                }
            }
        }

        return $issues;
    }
}
