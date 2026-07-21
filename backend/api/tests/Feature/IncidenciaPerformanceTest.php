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
        $resp = $this->getJson('/api/v1/incidents');
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
        $this->getJson('/api/v1/incidents');
        $queries12 = count(DB::getQueryLog());
        DB::flushQueryLog();

        $this->assertEquals($queries2, $queries12, "Se detectó N+1 en /api/v1/incidents. $queries2 vs $queries12");
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
    public function test_incidencia_index_uses_cursor_paginate()
    {
        $user = User::where('email', 'test@example.com')->first();
        $this->actingAs($user);

        $resp = $this->getJson('/api/v1/incidents');
        $resp->assertStatus(200);
        
        $data = $resp->json();
        
        // Verifica que NO tenga total (como lo hace el length-aware paginate)
        $this->assertArrayNotHasKey('total', $data, 'El listado masivo no debería devolver un conteo total para optimizar el rendimiento');
        
        // Verifica que tenga la estructura de cursorPaginate (prev_page_url, next_page_url, etc.)
        // O al menos data, path, per_page de un simplePaginate
        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('per_page', $data);
    }

    public function test_incidencia_query_execution_plan_uses_index()
    {
        // Forzar uso de índices en la consulta (estado_id y tipo_incidencia_id)
        $query1 = "SELECT * FROM reporte_incidencias WHERE estado_id = 1 AND tipo_incidencia_id = 1";
        // Forzar uso de índice en created_at
        $query2 = "SELECT * FROM reporte_incidencias WHERE created_at >= '2026-01-01 00:00:00'";
        
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('SET enable_seqscan = off');
            $explain1 = DB::select("EXPLAIN " . $query1);
            $plan1 = json_encode($explain1);
            $this->assertStringNotContainsString('Seq Scan on reporte_incidencias', $plan1, 'El plan de ejecución no debe contener un escaneo secuencial');

            $explain2 = DB::select("EXPLAIN " . $query2);
            $plan2 = json_encode($explain2);
            $this->assertStringNotContainsString('Seq Scan on reporte_incidencias', $plan2, 'El plan de ejecución no debe contener un escaneo secuencial para created_at');
            DB::statement('SET enable_seqscan = on');
        } elseif (DB::getDriverName() === 'sqlite') {
            $explain1 = DB::select("EXPLAIN QUERY PLAN " . $query1);
            $plan1 = json_encode($explain1);
            // En SQLite, el uso de índice se indica con "SEARCH TABLE ... USING INDEX"
            // y el escaneo secuencial con "SCAN TABLE"
            $this->assertStringContainsString('SEARCH', $plan1, 'El plan de ejecución debe usar SEARCH con un índice');
            $this->assertStringNotContainsString('SCAN TABLE reporte_incidencias', $plan1, 'El plan de ejecución no debe hacer SCAN (secuencial) completo');

            $explain2 = DB::select("EXPLAIN QUERY PLAN " . $query2);
            $plan2 = json_encode($explain2);
            $this->assertStringContainsString('SEARCH', $plan2, 'El plan de ejecución debe usar SEARCH con un índice para created_at');
            $this->assertStringNotContainsString('SCAN TABLE reporte_incidencias', $plan2, 'El plan no debe hacer SCAN secuencial para created_at');
        } else {
            $this->markTestSkipped('Database driver not supported for EXPLAIN plan test');
        }
    }

    public function test_gist_index_exists()
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Database driver is not PostgreSQL, skipping GiST index test.');
        }

        $result = DB::select("
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'direcciones' AND indexname = 'direcciones_ubicacion_gist'
        ");
        
        $this->assertNotEmpty($result, 'El índice GiST direcciones_ubicacion_gist no existe en la base de datos.');
    }

    public function test_spatial_query_execution_plan()
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Database driver is not PostgreSQL, skipping spatial query EXPLAIN test.');
        }

        // Consulta espacial usando ST_DWithin (aprovecha GiST)
        $query = "SELECT * FROM direcciones WHERE ST_DWithin(ubicacion, ST_SetSRID(ST_MakePoint(-99.1332, 19.4326), 4326), 1000)";
        
        $explain = DB::select("EXPLAIN " . $query);
        $plan = json_encode($explain);
        
        $this->assertStringNotContainsString('Seq Scan on direcciones', $plan, 'El plan de ejecución espacial no debe usar Seq Scan');
        $this->assertStringContainsString('Index Scan', $plan, 'El plan de ejecución espacial debería usar un Index Scan (GiST)');
    }
}
