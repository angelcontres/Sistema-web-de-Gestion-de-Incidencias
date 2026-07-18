<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $ciudadano;
    private User $institucionUser;
    private User $supervisorUser;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // Crear roles
        $adminRole = Role::create(['nombre' => 'Admin', 'descripcion' => 'Administrador']);
        $ciudadanoRole = Role::create(['nombre' => 'Ciudadano', 'descripcion' => 'Ciudadano']);
        $institucionRole = Role::create(['nombre' => 'Institucion', 'descripcion' => 'Institucion']);
        $supervisorRole = Role::create(['nombre' => 'Supervisor', 'descripcion' => 'Supervisor']);

        // Crear usuarios
        $this->admin = User::factory()->create(['role_id' => $adminRole->id]);
        $this->ciudadano = User::factory()->create(['role_id' => $ciudadanoRole->id]);
        $this->institucionUser = User::factory()->create(['role_id' => $institucionRole->id, 'institucion_id' => 1]);
        $this->supervisorUser = User::factory()->create(['role_id' => $supervisorRole->id]);
        
        // Tratar de sembrar algunas dimensiones si no existen para evitar foreign key errors en la inserción
        // Ignoramos errores porque la migración podría haberlos creado ya
        try {
            DB::statement('CREATE SCHEMA IF NOT EXISTS metrics');
            
            // Insertar datos dummy en dimensiones si la tabla está vacía
            if (DB::table('metrics.dim_estado')->count() === 0) {
                DB::table('metrics.dim_estado')->insert([
                    ['id' => 1, 'nombre' => 'Pendiente'],
                    ['id' => 2, 'nombre' => 'En Revisión'],
                    ['id' => 3, 'nombre' => 'En Proceso'],
                    ['id' => 4, 'nombre' => 'Resuelto'],
                ]);
            }
            if (DB::table('metrics.dim_tiempo')->count() === 0) {
                DB::table('metrics.dim_tiempo')->insert([
                    ['id' => 1, 'fecha' => now()->format('Y-m-d'), 'anio' => now()->year, 'mes' => now()->month, 'dia' => now()->day],
                ]);
            }
            if (DB::table('metrics.dim_prioridad')->count() === 0) {
                DB::table('metrics.dim_prioridad')->insert([
                    ['id' => 1, 'nombre' => 'Baja'],
                    ['id' => 2, 'nombre' => 'Alta'],
                ]);
            }
            if (DB::table('metrics.dim_institucion')->count() === 0) {
                DB::table('metrics.dim_institucion')->insert([
                    ['id' => 1, 'nombre' => 'Bomberos'],
                ]);
            }
        } catch (\Exception $e) {
            // Si falla es probablemente porque la BD de test es SQLite y no soporta esquemas
            // O porque ya existen. Ignoramos para que el test pueda continuar.
        }
    }

    public function test_stats_endpoint_requires_authentication()
    {
        $response = $this->getJson('/api/v1/dashboard/stats');
        $response->assertStatus(401);
    }

    public function test_metrics_endpoint_requires_authentication()
    {
        $response = $this->getJson('/api/v1/dashboard/metrics');
        $response->assertStatus(401);
    }

    public function test_stats_returns_correct_structure()
    {
        $response = $this->actingAs($this->admin)->getJson('/api/v1/dashboard/stats');
        
        $response->assertStatus(200)
            ->assertJsonStructure([
                'kpis' => ['activas', 'nuevas_activas_2h', 'sin_asignar', 'resueltas_hoy', 'tiempo_respuesta'],
                'servicios_mas_utilizados',
                'recientes',
                'mapa_reportes'
            ]);
    }

    public function test_metrics_returns_correct_structure_for_ciudadano()
    {
        $response = $this->actingAs($this->ciudadano)->getJson('/api/v1/dashboard/metrics?role=Ciudadano');
        
        $response->assertStatus(200)
            ->assertJsonStructure([
                'kpis' => ['mis_reportes', 'solucionados'],
                'distribucion_estado',
                'distribucion_prioridad',
                'tendencia_temporal'
            ]);
    }

    public function test_metrics_returns_correct_structure_for_institucion()
    {
        $response = $this->actingAs($this->institucionUser)->getJson('/api/v1/dashboard/metrics?role=Institucion');
        
        $response->assertStatus(200)
            ->assertJsonStructure([
                'kpis' => ['asignadas', 'en_proceso', 'resueltas'],
                'distribucion_estado',
                'tendencia_temporal'
            ]);
    }

    public function test_metrics_returns_correct_structure_for_admin()
    {
        $response = $this->actingAs($this->admin)->getJson('/api/v1/dashboard/metrics?role=Admin');
        
        $response->assertStatus(200)
            ->assertJsonStructure([
                'kpis' => ['totales', 'sin_asignar', 'resueltas', 'pendientes'],
                'distribucion_estado',
                'incidencias_institucion',
                'tendencia_temporal'
            ]);
    }
    
    public function test_metrics_returns_correct_structure_for_supervisor()
    {
        $response = $this->actingAs($this->supervisorUser)->getJson('/api/v1/dashboard/metrics?role=Supervisor');
        
        $response->assertStatus(200)
            ->assertJsonStructure([
                'kpis' => ['totales', 'sin_asignar', 'resueltas', 'pendientes'],
                'distribucion_estado',
                'incidencias_institucion',
                'tendencia_temporal'
            ]);
    }
}
