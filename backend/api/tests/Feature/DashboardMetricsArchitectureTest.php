<?php

namespace Tests\Feature;

use App\Models\User;
use App\Queries\DashboardMetricsQuery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\QueryException;
use Tests\TestCase;
use Mockery;

class DashboardMetricsArchitectureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
    }

    public function test_controller_delegates_to_dashboard_metrics_query()
    {
        $user = User::where('email', 'test@example.com')->first();
        $this->actingAs($user);

        // Spy en la clase DashboardMetricsQuery
        $mock = Mockery::mock(DashboardMetricsQuery::class)->makePartial();
        $mock->shouldReceive('getMetrics')
            ->once()
            ->andReturn(['mocked' => true]);
            
        $this->app->instance(DashboardMetricsQuery::class, $mock);

        $response = $this->getJson('/api/v1/dashboard/metrics');
        $response->assertStatus(200);
        $response->assertJson(['mocked' => true]);
    }
    
    public function test_query_object_uses_query_builder_instead_of_eloquent()
    {
        $user = User::where('email', 'test@example.com')->first();
        
        $queryObject = new DashboardMetricsQuery();
        
        \Illuminate\Support\Facades\Cache::flush();
        
        $queryExecuted = false;
        \Illuminate\Support\Facades\DB::listen(function ($query) use (&$queryExecuted) {
            if (str_contains($query->sql, 'metrics') && str_contains($query->sql, 'fact_incidencias')) {
                $queryExecuted = true;
            }
        });
        
        try {
            $queryObject->getMetrics('Ciudadano', $user);
        } catch (\Exception $e) {
            // En caso de que falle por esquema no existente en sqlite
        }
        
        $this->assertTrue($queryExecuted, "La consulta debe realizarse mediante Query Builder directo (DB::table) a 'metrics.fact_incidencias'");
    }
}
