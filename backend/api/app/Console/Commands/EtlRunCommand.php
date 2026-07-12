<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\Etl\SyncDimensionsJob;
use App\Jobs\Etl\SyncFactIncidenciasJob;
use App\Jobs\Etl\LoadSqaMetricsFromJsonJob;
use App\Jobs\Etl\SyncPerformanceLogsJob;

class EtlRunCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'etl:run {--only= : Ejecuta un proceso específico (dimensions|incidencias|sqa|performance)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ejecuta los procesos ETL para poblar el DW en el esquema metrics';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $only = $this->option('only');

        if ($only) {
            $this->info("Ejecutando únicamente el proceso: {$only}");
            switch ($only) {
                case 'dimensions':
                case 'dim':
                    SyncDimensionsJob::dispatchSync();
                    $this->info('Dimensiones sincronizadas.');
                    break;
                case 'incidencias':
                    SyncFactIncidenciasJob::dispatchSync();
                    $this->info('Hechos de incidencias sincronizados.');
                    break;
                case 'sqa':
                    LoadSqaMetricsFromJsonJob::dispatchSync();
                    $this->info('Métricas SQA cargadas.');
                    break;
                case 'performance':
                    SyncPerformanceLogsJob::dispatchSync();
                    $this->info('Hechos de performance sincronizados.');
                    break;
                default:
                    $this->error("Opción '{$only}' no válida. Use: dimensions, incidencias, sqa, o performance.");
                    return 1;
            }
            return 0;
        }

        $this->info('Iniciando proceso ETL para el Data Warehouse...');

        $this->info('1/4 Ejecutando sincronización de dimensiones...');
        SyncDimensionsJob::dispatchSync();
        $this->info('Dimensiones sincronizadas.');

        $this->info('2/4 Ejecutando sincronización de hechos de incidencias...');
        SyncFactIncidenciasJob::dispatchSync();
        $this->info('Hechos de incidencias sincronizados.');

        $this->info('3/4 Cargando métricas SQA desde JSONs...');
        LoadSqaMetricsFromJsonJob::dispatchSync();
        $this->info('Métricas SQA cargadas.');

        $this->info('4/4 Ejecutando sincronización de hechos de performance...');
        SyncPerformanceLogsJob::dispatchSync();
        $this->info('Hechos de performance sincronizados.');

        $this->info('Proceso ETL completado con éxito.');
        return 0;
    }
}
