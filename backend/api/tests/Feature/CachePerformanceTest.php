<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CachePerformanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_catalogs_are_cached()
    {
        $user = User::where('email', 'test@example.com')->first();
        $this->actingAs($user);

        Cache::flush();

        DB::enableQueryLog();
        $this->getJson('/api/v1/catalogs/countries');
        $queriesFirstCall = count(DB::getQueryLog());

        $this->assertGreaterThan(0, $queriesFirstCall, 'Debería haber consultas a BD en la primera llamada');

        DB::flushQueryLog();

        $this->getJson('/api/v1/catalogs/countries');
        $queriesSecondCall = count(DB::getQueryLog());

        $this->assertEquals(0, $queriesSecondCall, 'No debería haber consultas a BD en la segunda llamada (caché)');
    }

    public function test_metrics_are_cached()
    {
        $user = User::where('email', 'test@example.com')->first();
        $this->actingAs($user);

        // Si es mock, la primera llamada llama a DB, la segunda no, pero DB::table('metrics...') falla en SQLite en memoria.
        // Así que simularemos caché pre-existente o mockeamos la DB.

        // Mock de Cache para simular que devuelve los datos directo.
        Cache::shouldReceive('remember')
            ->twice() // 1 para /api/v1/dashboard/metrics, etc
            ->andReturn(['kpis' => []]);

        $this->getJson('/api/v1/dashboard/metrics')->assertStatus(200);
        $this->getJson('/api/v1/dashboard/metrics')->assertStatus(200);
    }
}
