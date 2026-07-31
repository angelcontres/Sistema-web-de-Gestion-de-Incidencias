<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

#[Signature('sqa:vco {--path=../../}')]
#[Description('Calcula las Vulnerabilidades Críticas (OWASP) (VCO)')]
class CalculateVco extends Command
{
    private const UNKNOWN_VULNERABILITY = 'Vulnerabilidad Desconocida';

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

        $this->info("\n[1/2] Auditando dependencias del Backend (composer audit)...");
        $backendIssues = $this->auditBackend();

        $this->info("\n[2/2] Escaneando código fuente del Frontend (SAST)...");
        $frontendPath = $targetPath.DIRECTORY_SEPARATOR.'frontend';
        $frontendIssues = $this->auditFrontend($frontendPath);

        $this->info("\nConsolidando resultados...");
        $this->printSummary($backendIssues, $frontendIssues);

        $this->saveToOlap($backendIssues, $frontendIssues);

        $this->info("\nMétricas de seguridad (VCO) guardadas exitosamente en el esquema OLAP (fact_security).");

        return 0;
    }

    private function printSummary(array $backendIssues, array $frontendIssues): void
    {
        $totalCriticalHigh = 0;

        foreach (array_merge($backendIssues, $frontendIssues) as $issue) {
            if (in_array(strtolower($issue['severity'] ?? ''), ['critical', 'high'])) {
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
    }

    private function saveToOlap(array $backendIssues, array $frontendIssues): void
    {
        $now = now()->timezone('America/Guayaquil');
        $tiempoId = (int) $now->format('YmdH');

        $this->ensureOlapDimensions($now, $tiempoId);
        $this->processIssuesToOlap($backendIssues, 1, $tiempoId); // 1 = Backend
        $this->processIssuesToOlap($frontendIssues, 2, $tiempoId); // 2 = Frontend
    }

    private function ensureOlapDimensions($now, int $tiempoId): void
    {
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

        DB::table('metrics.dim_capa')->updateOrInsert(
            ['id' => 1],
            ['nombre' => 'Backend', 'created_at' => now(), 'updated_at' => now()]
        );
        DB::table('metrics.dim_capa')->updateOrInsert(
            ['id' => 2],
            ['nombre' => 'Frontend', 'created_at' => now(), 'updated_at' => now()]
        );
    }

    private function processIssuesToOlap(array $issues, int $capaId, int $tiempoId): void
    {
        foreach ($issues as $issue) {
            $titulo = $issue['title'] ?? $issue['type'] ?? self::UNKNOWN_VULNERABILITY;
            $severidad = strtolower($issue['severity'] ?? 'unknown');
            $hash = hash('sha256', $titulo.'_'.$severidad);

            DB::table('metrics.dim_vulnerabilidad')->updateOrInsert(
                ['hash_identificador' => $hash],
                [
                    'titulo' => $titulo,
                    'severidad' => $severidad,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $vulnId = DB::table('metrics.dim_vulnerabilidad')
                ->where('hash_identificador', $hash)
                ->value('id');

            $componente = $capaId === 1 ? ($issue['package'] ?? 'Desconocido') : ($issue['file'] ?? 'Desconocido');
            $linea = $capaId === 1 ? 0 : ($issue['line'] ?? 0);
            $codigo = $capaId === 1 ? 'N/A' : ($issue['match'] ?? 'N/A');

            DB::table('metrics.fact_security')->insert([
                'tiempo_id' => $tiempoId,
                'capa_id' => $capaId,
                'vulnerabilidad_id' => $vulnId,
                'componente_afectado' => $componente,
                'linea_afectada' => $linea,
                'codigo_sospechoso' => $codigo,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
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
                            'title' => $advisory['title'] ?? self::UNKNOWN_VULNERABILITY,
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
        $rules = $this->getFrontendRules();

        foreach ($files as $file) {
            $issues = array_merge($issues, $this->auditFrontendFile($file, $rules));
        }

        return $issues;
    }

    private function getFrontendRules(): array
    {
        return [
            [
                'regex' => '/\binnerHTML\s*=/i',
                'type' => 'Cross-Site Scripting (XSS)',
                'severity' => 'high',
                'description' => 'Uso de innerHTML detectado. Riesgo de XSS. ' .
                                 'Se recomienda usar textContent o createElement.',
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
                'regex' => '/(api_key|apikey|password|secret|token)\s*[:=]\s*' .
                           '[\'"][a-zA-Z0-9\-\_]{16,}[\'"]/i',
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
    }

    private function auditFrontendFile($file, array $rules): array
    {
        $issues = [];
        $extension = strtolower($file->getExtension());
        if (! in_array($extension, ['js', 'html'])) {
            return $issues;
        }

        if (
            strpos($file->getRelativePathname(), 'node_modules') !== false ||
            strpos($file->getFilename(), '.min.js') !== false
        ) {
            return $issues;
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

        return $issues;
    }
}
