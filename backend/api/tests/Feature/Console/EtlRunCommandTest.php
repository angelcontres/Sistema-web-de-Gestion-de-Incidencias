<?php

namespace Tests\Feature\Console;

use App\Jobs\Etl\LoadSqaMetricsFromJsonJob;
use App\Jobs\Etl\SyncDimensionsJob;
use App\Jobs\Etl\SyncFactIncidenciasJob;
use App\Jobs\Etl\SyncPerformanceLogsJob;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class EtlRunCommandTest extends TestCase
{
    public function test_runs_only_dimensions()
    {
        Bus::fake();

        $this->artisan('etl:run', ['--only' => 'dimensions'])
            ->expectsOutput('Ejecutando únicamente el proceso: dimensions')
            ->expectsOutput('Dimensiones sincronizadas.')
            ->assertExitCode(0);

        Bus::assertDispatchedSync(SyncDimensionsJob::class);
    }

    public function test_runs_only_incidencias()
    {
        Bus::fake();

        $this->artisan('etl:run', ['--only' => 'incidencias'])
            ->expectsOutput('Ejecutando únicamente el proceso: incidencias')
            ->expectsOutput('Hechos de incidencias sincronizados.')
            ->assertExitCode(0);

        Bus::assertDispatchedSync(SyncFactIncidenciasJob::class);
    }

    public function test_runs_only_sqa()
    {
        Bus::fake();

        $this->artisan('etl:run', ['--only' => 'sqa'])
            ->expectsOutput('Ejecutando únicamente el proceso: sqa')
            ->expectsOutput('Métricas SQA cargadas.')
            ->assertExitCode(0);

        Bus::assertDispatchedSync(LoadSqaMetricsFromJsonJob::class);
    }

    public function test_runs_only_performance()
    {
        Bus::fake();

        $this->artisan('etl:run', ['--only' => 'performance'])
            ->expectsOutput('Ejecutando únicamente el proceso: performance')
            ->expectsOutput('Hechos de performance sincronizados.')
            ->assertExitCode(0);

        Bus::assertDispatchedSync(SyncPerformanceLogsJob::class);
    }

    public function test_runs_invalid_option()
    {
        $this->artisan('etl:run', ['--only' => 'invalid_opt'])
            ->expectsOutput("Opción 'invalid_opt' no válida. Use: dimensions, incidencias, sqa, o performance.")
            ->assertExitCode(1);
    }

    public function test_runs_full_etl_process()
    {
        Bus::fake();

        $this->artisan('etl:run')
            ->expectsOutput('Iniciando proceso ETL para el Data Warehouse...')
            ->expectsOutput('1/4 Ejecutando sincronización de dimensiones...')
            ->expectsOutput('Dimensiones sincronizadas.')
            ->expectsOutput('2/4 Ejecutando sincronización de hechos de incidencias...')
            ->expectsOutput('Hechos de incidencias sincronizados.')
            ->expectsOutput('4/4 Ejecutando sincronización de hechos de performance...')
            ->expectsOutput('Hechos de performance sincronizados.')
            ->expectsOutput('Proceso ETL completado con éxito.')
            ->assertExitCode(0);

        Bus::assertDispatchedSync(SyncDimensionsJob::class);
        Bus::assertDispatchedSync(SyncFactIncidenciasJob::class);
        Bus::assertDispatchedSync(SyncPerformanceLogsJob::class);
        Bus::assertNotDispatchedSync(LoadSqaMetricsFromJsonJob::class);
    }
}
