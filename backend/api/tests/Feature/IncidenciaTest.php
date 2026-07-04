<?php

namespace Tests\Feature;

use App\Models\Direccion;
use App\Models\Pais;
use App\Models\Territorio;
use App\Models\User;
use App\Models\Role;
use App\Models\Prioridad;
use App\Models\Institucion;
use App\Models\EstadoIncidencia;
use App\Models\CategoriaIncidencia;
use App\Models\Incidencia;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IncidenciaTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Pais $pais;
    private Territorio $territorio;
    private Direccion $direccion;
    private Prioridad $critica;
    private Prioridad $alta;
    private Prioridad $media;
    private Prioridad $baja;
    private Institucion $bomberos;
    private Institucion $policia;
    private EstadoIncidencia $estadoRevision;
    private CategoriaIncidencia $categoriaPadre;
    private CategoriaIncidencia $subcategoriaAlta;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = $this->createAdminUser();

        $this->pais = Pais::create([
            'nombre' => 'Ecuador',
            'codigo_iso' => 'EC',
            'activo' => true
        ]);

        $this->territorio = Territorio::create([
            'pais_id' => $this->pais->id,
            'nombre' => 'Pichincha',
            'tipo' => 'Provincia',
        ]);

        $this->direccion = Direccion::create([
            'territorio_id' => $this->territorio->id,
            'detalle' => 'Av. Amazonas N24-123',
            'activo' => true,
        ]);

        // Seed prioridades
        $this->critica = Prioridad::create(['id' => 1, 'nombre' => 'Crítica', 'color_hex' => '#FF0000']);
        $this->alta = Prioridad::create(['id' => 2, 'nombre' => 'Alta', 'color_hex' => '#FF8C00']);
        $this->media = Prioridad::create(['id' => 3, 'nombre' => 'Media', 'color_hex' => '#FFD700']);
        $this->baja = Prioridad::create(['id' => 4, 'nombre' => 'Baja', 'color_hex' => '#008000']);

        // Seed instituciones
        $this->bomberos = Institucion::create(['nombre' => 'Bomberos', 'siglas' => 'BOMBEROS', 'activo' => true]);
        $this->policia = Institucion::create(['nombre' => 'Policía', 'siglas' => 'POLICIA', 'activo' => true]);

        // Seed estados
        $this->estadoRevision = EstadoIncidencia::create(['id' => 2, 'nombre' => 'En Revisión']);

        // Seed categorias
        $this->categoriaPadre = CategoriaIncidencia::create([
            'nombre' => 'Medio Ambiente y Movilidad',
            'activo' => true,
        ]);

        $this->subcategoriaAlta = CategoriaIncidencia::create([
            'parent_id' => $this->categoriaPadre->id,
            'prioridad_id' => $this->alta->id,
            'nombre' => 'Tránsito y movilidad',
            'activo' => true,
        ]);
    }

    public function test_can_create_incidencia_recalculates_priority_normal()
    {
        $payload = [
            'incidencia_descripcion' => 'Choque leve sin heridos',
            'direccion_id' => $this->direccion->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'cantidad_afectados_incidencia' => 2, // < 10 affected
            'institucion_id' => $this->policia->id,
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/v1/incidencias', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.prioridad_id', $this->alta->id) // Remains Alta
            ->assertJsonPath('data.estado_id', 2); // Default En Revisión
    }

    public function test_can_create_incidencia_recalculates_priority_critical_when_affected_over_threshold()
    {
        $payload = [
            'incidencia_descripcion' => 'Choque masivo de transporte público',
            'direccion_id' => $this->direccion->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'cantidad_afectados_incidencia' => 15, // >= 10 affected
            'institucion_id' => $this->policia->id,
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/v1/incidencias', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.prioridad_id', $this->critica->id); // Upgraded to Crítica
    }

    public function test_can_update_incidencia_with_optimistic_locking()
    {
        $incidencia = Incidencia::create([
            'incidencia_descripcion' => 'Árbol caído',
            'direccion_id' => $this->direccion->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'prioridad_id' => $this->alta->id,
            'cantidad_afectados_incidencia' => 1,
            'estado_id' => $this->estadoRevision->id,
            'version' => 1,
        ]);

        // Try updating with incorrect version
        $payloadIncorrect = [
            'incidencia_descripcion' => 'Árbol caído modificado',
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'cantidad_afectados_incidencia' => 1,
            'version' => 2, // Wrong version, current is 1
        ];

        $response = $this->actingAs($this->admin)->putJson("/api/v1/incidencias/{$incidencia->id}", $payloadIncorrect);
        $response->assertStatus(409); // Conflict

        // Update with correct version
        $payloadCorrect = [
            'incidencia_descripcion' => 'Árbol caído corregido',
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'cantidad_afectados_incidencia' => 1,
            'version' => 1, // Correct version
        ];

        $response = $this->actingAs($this->admin)->putJson("/api/v1/incidencias/{$incidencia->id}", $payloadCorrect);
        $response->assertStatus(200)
            ->assertJsonPath('data.version', 2) // Version incremented
            ->assertJsonPath('data.incidencia_descripcion', 'Árbol caído corregido');
    }

    public function test_role_based_visibility_for_institucion()
    {
        // Create two incidents for different institutions
        $incidenciaPolicia = Incidencia::create([
            'incidencia_descripcion' => 'Robo a tienda',
            'direccion_id' => $this->direccion->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'prioridad_id' => $this->alta->id,
            'institucion_id' => $this->policia->id,
            'estado_id' => $this->estadoRevision->id,
            'version' => 1,
        ]);

        $incidenciaBomberos = Incidencia::create([
            'incidencia_descripcion' => 'Fuga de gas',
            'direccion_id' => $this->direccion->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'prioridad_id' => $this->alta->id,
            'institucion_id' => $this->bomberos->id,
            'estado_id' => $this->estadoRevision->id,
            'version' => 1,
        ]);

        // Create an Institution user for Policia
        $userPolicia = User::factory()->create(['institucion_id' => $this->policia->id]);
        $institucionRole = Role::create(['nombre' => 'Institucion', 'descripcion' => 'Rol de Institución']);
        $userPolicia->roles()->sync([$institucionRole->id]);

        // Fetch index with userPolicia -> should see only Policia incident
        $response = $this->actingAs($userPolicia)->getJson('/api/v1/incidencias');
        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $incidenciaPolicia->id);

        // Access Policia incident -> OK
        $responseShowOk = $this->actingAs($userPolicia)->getJson("/api/v1/incidencias/{$incidenciaPolicia->id}");
        $responseShowOk->assertStatus(200);

        // Access Bomberos incident -> 403 Forbidden
        $responseShowForbidden = $this->actingAs($userPolicia)->getJson("/api/v1/incidencias/{$incidenciaBomberos->id}");
        $responseShowForbidden->assertStatus(403);
    }
}
