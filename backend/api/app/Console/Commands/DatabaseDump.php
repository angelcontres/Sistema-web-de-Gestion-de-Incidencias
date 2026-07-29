<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

#[Signature('db:dump')]
#[Description('Genera un volcado SQL de la base de datos (híbrido: Docker o local)')]
class DatabaseDump extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dbName = config('database.connections.pgsql.database');
        $dbUser = config('database.connections.pgsql.username');
        $dbHost = config('database.connections.pgsql.host');
        $dbPort = config('database.connections.pgsql.port');
        $dbPassword = config('database.connections.pgsql.password');

        $timestamp = now()->format('Ymd_Hi');
        $fileName = "dump_{$dbName}_{$timestamp}.sql";
        $filePath = storage_path("app/backups/{$fileName}");

        // Ensure backups directory exists
        if (! is_dir(dirname($filePath))) {
            mkdir(dirname($filePath), 0755, true);
        }

        $this->info('Iniciando volcado de base de datos...');

        try {
            // T3: Verificar si Docker y el contenedor están disponibles
            $dockerCheck = new Process(['docker', 'ps', '-q', '-f', 'name=sistema_postgres']);
            $dockerCheck->run();

            if ($dockerCheck->isSuccessful() && trim($dockerCheck->getOutput()) !== '') {
                $this->info('Contenedor Docker detectado. Ejecutando volcado mediante docker exec...');

                // Docker exec command
                $command = [
                    'docker', 'exec', 'sistema_postgres',
                    'pg_dump', '-U', $dbUser, '-d', $dbName, '-F', 'p',
                ];

                $process = new Process($command);
                $process->setTimeout(300); // 5 minutos

                $file = fopen($filePath, 'w');
                $process->run(function ($type, $buffer) use ($file) {
                    if ($type === Process::OUT) {
                        fwrite($file, $buffer);
                    }
                });
                fclose($file);

                if (! $process->isSuccessful()) {
                    @unlink($filePath);
                    throw new \RuntimeException(
                        'Error al ejecutar pg_dump en el contenedor: ' .
                        $process->getErrorOutput()
                    );
                }
            } else {
                // T4: Fallback a pg_dump local
                $this->info('Docker no disponible o contenedor inactivo. Intentando con pg_dump local...');

                $command = [
                    'pg_dump', '-h', $dbHost, '-p', $dbPort, '-U', $dbUser, '-d', $dbName, '-F', 'p',
                ];

                $process = new Process($command);
                $process->setTimeout(300);

                $env = $_SERVER;
                $env['PGPASSWORD'] = $dbPassword;
                $process->setEnv($env);

                $file = fopen($filePath, 'w');
                $process->run(function ($type, $buffer) use ($file) {
                    if ($type === Process::OUT) {
                        fwrite($file, $buffer);
                    }
                });
                fclose($file);

                if (! $process->isSuccessful()) {
                    @unlink($filePath);
                    throw new \RuntimeException(
                        'Error al ejecutar pg_dump localmente: ' .
                        $process->getErrorOutput()
                    );
                }
            }

            $this->info("Volcado generado exitosamente en: {$filePath}");

            return Command::SUCCESS;

        } catch (\Throwable $e) {
            // T5: Manejo de errores global
            $this->error('Fallo el proceso de volcado: '.$e->getMessage());

            return Command::FAILURE;
        }
    }
}
