<?php

namespace Tests\Feature\Jobs\Etl;

use App\Jobs\Etl\SyncPerformanceLogsJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SyncPerformanceLogsJobTest extends TestCase
{
    use RefreshDatabase;


    public function test_syncs_endpoints_and_logs()
    {
        // Limpiar para asegurar estado aislado
        DB::table('performance_logs')->delete();
        DB::table('metrics.fact_performance')->delete();
        DB::table('metrics.dim_endpoint')->delete();
        DB::table('metrics.dim_tiempo')->delete();

        DB::table('performance_logs')->insert([
            'endpoint' => '/api/test',
            'metodo' => 'GET',
            'trp' => 150,
            'logged_at' => now()->subMinutes(5),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $job = new SyncPerformanceLogsJob;
        $job->handle();

        $this->assertDatabaseHas('metrics.dim_endpoint', [
            'path' => '/api/test',
            'metodo' => 'GET',
        ]);

        $this->assertDatabaseHas('metrics.fact_performance', [
            'trp' => 150,
            'status_code' => 200, // as hardcoded in job
        ]);
    }
}
