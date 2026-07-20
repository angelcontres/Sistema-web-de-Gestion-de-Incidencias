<?php

namespace Tests\Feature;

use App\Models\Incidencia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class IncidenciaPerformanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
    }

    public function test_incidencia_index_no_n_plus_one()
    {
        $user = User::where('email', 'test@example.com')->first();
        $this->actingAs($user);

        for ($i=0; $i<2; $i++) {
            Incidencia::create([
                'incidencia_descripcion' => 'Test 1',
                'estado_id' => 1,
                'cliente_id' => $user->id,
            ]);
        }

        DB::enableQueryLog();
        $resp = $this->getJson('/api/v1/incidencias');
        $resp->assertStatus(200);
        $queries2 = count(DB::getQueryLog());
        DB::flushQueryLog();

        for ($i=0; $i<10; $i++) {
            Incidencia::create([
                'incidencia_descripcion' => 'Test 2',
                'estado_id' => 1,
                'cliente_id' => $user->id,
            ]);
        }
        
        DB::flushQueryLog();
        $this->getJson('/api/v1/incidencias');
        $queries12 = count(DB::getQueryLog());
        DB::flushQueryLog();

        $this->assertEquals($queries2, $queries12, "Se detectó N+1 en /api/v1/incidencias. $queries2 vs $queries12");
    }

    public function test_dashboard_stats_no_n_plus_one()
    {
        $user = User::where('email', 'test@example.com')->first();
        $this->actingAs($user);

        for ($i=0; $i<2; $i++) {
            Incidencia::create([
                'incidencia_descripcion' => 'Test 1',
                'estado_id' => 1,
                'cliente_id' => $user->id,
            ]);
        }

        DB::enableQueryLog();
        $resp = $this->getJson('/api/v1/dashboard/stats');
        $resp->assertStatus(200);
        $queries2 = count(DB::getQueryLog());
        DB::flushQueryLog();

        for ($i=0; $i<10; $i++) {
            Incidencia::create([
                'incidencia_descripcion' => 'Test 2',
                'estado_id' => 1,
                'cliente_id' => $user->id,
            ]);
        }
        
        DB::flushQueryLog();
        $this->getJson('/api/v1/dashboard/stats');
        $queries12 = count(DB::getQueryLog());
        DB::flushQueryLog();

        $this->assertEquals($queries2, $queries12, "Se detectó N+1 en /api/v1/dashboard/stats. $queries2 vs $queries12");
    }
}
