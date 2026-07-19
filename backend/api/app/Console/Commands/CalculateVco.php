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

        // 4. Guardar en esquema analítico OLAP
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

        // Asegurar que las capas existan
        DB::table('metrics.dim_capa')->updateOrInsert(
            ['id' => 1],
            ['nombre' => 'Backend', 'created_at' => now(), 'updated_at' => now()]
        );
        DB::table('metrics.dim_capa')->updateOrInsert(
            ['id' => 2],
            ['nombre' => 'Frontend', 'created_at' => now(), 'updated_at' => now()]
        );

        // Procesar vulnerabilidades del Backend
        foreach ($backendIssues as $issue) {
            $titulo = $issue['title'] ?? 'Vulnerabilidad Desconocida';
            $severidad = strtolower($issue['severity'] ?? 'unknown');
            $hash = hash('sha256', $titulo.'_'.$severidad);

            // Asegurar vulnerabilidad en dim_vulnerabilidad
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

            // Insertar en la tabla de hechos
            DB::table('metrics.fact_security')->insert([
                'tiempo_id' => $tiempoId,
                'capa_id' => 1, // Backend
                'vulnerabilidad_id' => $vulnId,
                'componente_afectado' => $issue['package'] ?? 'Desconocido',
                'linea_afectada' => 0, // 0 a nivel de paquete
                'codigo_sospechoso' => 'N/A',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Procesar vulnerabilidades del Frontend
        foreach ($frontendIssues as $issue) {
            $titulo = $issue['type'] ?? 'Vulnerabilidad Desconocida';
            $severidad = strtolower($issue['severity'] ?? 'unknown');
            $hash = hash('sha256', $titulo.'_'.$severidad);

            // Asegurar vulnerabilidad en dim_vulnerabilidad
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

            // Insertar en la tabla de hechos
            DB::table('metrics.fact_security')->insert([
                'tiempo_id' => $tiempoId,
                'capa_id' => 2, // Frontend
                'vulnerabilidad_id' => $vulnId,
                'componente_afectado' => $issue['file'] ?? 'Desconocido',
                'linea_afectada' => $issue['line'] ?? 0,
                'codigo_sospechoso' => $issue['match'] ?? 'N/A',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->info("\nMétricas de seguridad (VCO) guardadas exitosamente en el esquema OLAP (fact_security).");

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
