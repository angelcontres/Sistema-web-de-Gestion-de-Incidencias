<?php

namespace Tests\Feature;

use App\Models\CategoriaIncidencia;
use App\Models\Direccion;
use App\Models\EstadoIncidencia;
use App\Models\Incidencia;
use App\Models\Institucion;
use App\Models\Pais;
use App\Models\Permiso;
use App\Models\OpcionMenu;
use App\Models\Prioridad;
use App\Models\Role;
use App\Models\Territorio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Services\IncidentGroupingService;
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

    private EstadoIncidencia $estadoPendiente;

    private EstadoIncidencia $estadoRevision;

    private CategoriaIncidencia $categoriaPadre;

    private CategoriaIncidencia $subcategoriaAlta;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = $this->createAdminUser();

        $this->pais = Pais::firstOrCreate(
            ['codigo_iso' => 'EC'],
            ['nombre' => 'Ecuador', 'activo' => true]
        );

        $this->territorio = Territorio::firstOrCreate(
            ['nombre' => 'Pichincha', 'pais_id' => $this->pais->id],
            ['tipo' => 'Provincia']
        );

        $this->direccion = Direccion::create([
            'territorio_id' => $this->territorio->id,
            'detalle' => 'Av. Amazonas N24-123',
            'activo' => true,
        ]);

        // Seed prioridades
        $this->critica = Prioridad::firstOrCreate(['id' => 1], ['nombre' => 'Crítica', 'color_hex' => '#FF0000']);
        $this->alta = Prioridad::firstOrCreate(['id' => 2], ['nombre' => 'Alta', 'color_hex' => '#FF8C00']);
        $this->media = Prioridad::firstOrCreate(['id' => 3], ['nombre' => 'Media', 'color_hex' => '#FFD700']);
        $this->baja = Prioridad::firstOrCreate(['id' => 4], ['nombre' => 'Baja', 'color_hex' => '#008000']);

        // Seed instituciones
        $this->bomberos = Institucion::firstOrCreate(['nombre' => 'Bomberos'], ['siglas' => 'BOMBEROS', 'activo' => true]);
        $this->policia = Institucion::firstOrCreate(['nombre' => 'Policía'], ['siglas' => 'POLICIA', 'activo' => true]);

        // Seed estados
        $this->estadoPendiente = EstadoIncidencia::firstOrCreate(['id' => 1], ['nombre' => 'Pendiente']);
        $this->estadoRevision = EstadoIncidencia::firstOrCreate(['id' => 2], ['nombre' => 'En Revisión']);

        // Seed categorias
        $this->categoriaPadre = CategoriaIncidencia::firstOrCreate(
            ['nombre' => 'Medio Ambiente y Movilidad'],
            ['activo' => true]
        );

        $this->subcategoriaAlta = CategoriaIncidencia::firstOrCreate(
            ['nombre' => 'Tránsito y movilidad'],
            [
                'parent_id' => $this->categoriaPadre->id,
                'prioridad_id' => $this->alta->id,
                'institucion_id' => $this->policia->id,
                'activo' => true,
            ]
        );
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
            ->assertJsonPath('data.estado_id', 1) // Default Pendiente
            ->assertJsonPath('data.direccion.territorio.pais.nombre', 'Ecuador');
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
            'cliente_id' => $this->admin->id,
            'institucion_id' => $this->policia->id,
            'created_by' => $this->admin->id,
            'updated_by' => $this->admin->id,
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
            'cliente_id' => $this->admin->id,
            'created_by' => $this->admin->id,
            'updated_by' => $this->admin->id,
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
            'cliente_id' => $this->admin->id,
            'created_by' => $this->admin->id,
            'updated_by' => $this->admin->id,
        ]);

        // Fetch or create an Institution user for Policia
        $userPolicia = User::factory()->create(['institucion_id' => $this->policia->id]);
        $institucionRole = Role::firstOrCreate(
            ['nombre' => 'Institucion'],
            ['descripcion' => 'Rol de Institución', 'created_by' => $this->admin->id]
        );
        $userPolicia->roles()->sync([$institucionRole->id]);

        $opcion = OpcionMenu::firstOrCreate(['nombre' => 'Incidencias', 'ruta' => '/incidencias', 'created_by' => $this->admin->id]);
        $permisoVer = Permiso::firstOrCreate(['nombre' => 'Ver Incidencia'], ['accion' => 'READ', 'recurso' => 'incidencias', 'opcion_menu_id' => $opcion->id]);
        $institucionRole->permisos()->sync([$permisoVer->id]);

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

    public function test_ciudadano_can_create_incidencia()
    {
        $ciudadanoUser = User::factory()->create();
        $ciudadanoRole = Role::firstOrCreate(['nombre' => 'Ciudadano'], ['descripcion' => 'Ciudadano', 'created_by' => $this->admin->id]);
        $ciudadanoUser->roles()->sync([$ciudadanoRole->id]);

        $opcion = OpcionMenu::firstOrCreate(['nombre' => 'Incidencias', 'ruta' => '/incidencias', 'created_by' => $this->admin->id]);
        $permisoVer = Permiso::firstOrCreate(['nombre' => 'Ver Incidencia'], ['accion' => 'READ', 'recurso' => 'incidencias', 'opcion_menu_id' => $opcion->id]);
        $permisoCrear = Permiso::firstOrCreate(['nombre' => 'Crear Incidencia'], ['accion' => 'CREATE', 'recurso' => 'incidencias', 'opcion_menu_id' => $opcion->id]);
        $ciudadanoRole->permisos()->sync([$permisoVer->id, $permisoCrear->id]);

        $payload = [
            'incidencia_descripcion' => 'Bache crítico reportado por ciudadano',
            'direccion_id' => $this->direccion->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'cantidad_afectados_incidencia' => 3,
        ];

        $response = $this->actingAs($ciudadanoUser)->postJson('/api/v1/incidencias', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.estado_id', 1) // Pendiente
            ->assertJsonPath('data.cliente_id', $ciudadanoUser->id)
            ->assertJsonPath('data.direccion.territorio.pais.nombre', 'Ecuador');
    }

    public function test_ciudadano_can_access_catalogos()
    {
        $ciudadanoUser = User::factory()->create();
        $ciudadanoRole = Role::firstOrCreate(['nombre' => 'Ciudadano'], ['descripcion' => 'Ciudadano', 'created_by' => $this->admin->id]);
        $ciudadanoUser->roles()->sync([$ciudadanoRole->id]);

        $responsePaises = $this->actingAs($ciudadanoUser)->getJson('/api/v1/catalogos/paises');
        $responsePaises->assertStatus(200);

        $responseCategorias = $this->actingAs($ciudadanoUser)->getJson('/api/v1/catalogos/categorias-incidencia');
        $responseCategorias->assertStatus(200);
    }

    public function test_can_soft_delete_incidencia()
    {
        $incidencia = Incidencia::create([
            'incidencia_descripcion' => 'Prueba de eliminación',
            'direccion_id' => $this->direccion->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'prioridad_id' => $this->alta->id,
            'cantidad_afectados_incidencia' => 1,
            'estado_id' => $this->estadoRevision->id,
            'version' => 1,
            'cliente_id' => $this->admin->id,
            'institucion_id' => $this->policia->id,
            'created_by' => $this->admin->id,
            'updated_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->deleteJson("/api/v1/incidencias/{$incidencia->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('message', 'Incidencia eliminada con éxito');

        $this->assertSoftDeleted('reporte_incidencias', [
            'id' => $incidencia->id,
        ]);

        // Verify deleted_by is populated
        $deletedIncidencia = Incidencia::withTrashed()->find($incidencia->id);
        $this->assertEquals($this->admin->id, $deletedIncidencia->deleted_by);
    }

    public function test_can_change_incidencia_status()
    {
        $incidencia = Incidencia::create([
            'incidencia_descripcion' => 'Prueba de cambio de estado',
            'direccion_id' => $this->direccion->id,
            'cliente_id' => $this->admin->id,
            'institucion_id' => $this->policia->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'prioridad_id' => $this->alta->id,
            'cantidad_afectados_incidencia' => 1,
            'estado_id' => 2, // En Revisión
            'version' => 1,
            'created_by' => $this->admin->id,
            'updated_by' => $this->admin->id,
        ]);

        $nuevoEstado = EstadoIncidencia::firstOrCreate(['id' => 3], ['nombre' => 'Resuelto']);

        $payload = [
            'estado_id' => $nuevoEstado->id,
            'version' => 1,
        ];

        $response = $this->actingAs($this->admin)->putJson("/api/v1/incidencias/{$incidencia->id}", $payload);

        $response->assertStatus(200)
                 ->assertJsonPath('data.estado_id', $nuevoEstado->id);

        $this->assertDatabaseHas('reporte_incidencias', [
            'id' => $incidencia->id,
            'estado_id' => $nuevoEstado->id,
        ]);
    }

    public function test_can_filter_incidencias_by_estado()
    {
        $estadoPendiente = EstadoIncidencia::firstOrCreate(['id' => 1], ['nombre' => 'Pendiente']);

        $incidencia1 = Incidencia::create([
            'incidencia_descripcion' => 'Incidencia 1',
            'direccion_id' => $this->direccion->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'estado_id' => $estadoPendiente->id,
            'version' => 1,
            'cliente_id' => $this->admin->id,
            'institucion_id' => $this->policia->id,
            'created_by' => $this->admin->id,
            'updated_by' => $this->admin->id,
        ]);

        $incidencia2 = Incidencia::create([
            'incidencia_descripcion' => 'Incidencia 2',
            'direccion_id' => $this->direccion->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'estado_id' => $this->estadoRevision->id,
            'version' => 1,
            'cliente_id' => $this->admin->id,
            'institucion_id' => $this->policia->id,
            'created_by' => $this->admin->id,
            'updated_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->getJson("/api/v1/incidencias?estado_id={$estadoPendiente->id}");

        $response->assertStatus(200);
        $data = $response->json();

        // Assert we get the one with estadoPendiente
        $containsIncidencia1 = collect($data)->contains('id', $incidencia1->id);
        $containsIncidencia2 = collect($data)->contains('id', $incidencia2->id);

        $this->assertTrue($containsIncidencia1);
        $this->assertFalse($containsIncidencia2);
    }

    public function test_can_filter_incidencias_by_tipo()
    {
        $otroTipo = CategoriaIncidencia::firstOrCreate(['id' => 99], ['nombre' => 'Otro Tipo', 'activo' => true]);

        $incidencia1 = Incidencia::create([
            'incidencia_descripcion' => 'Incidencia Tipo 1',
            'direccion_id' => $this->direccion->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'estado_id' => $this->estadoRevision->id,
            'version' => 1,
            'cliente_id' => $this->admin->id,
            'institucion_id' => $this->policia->id,
            'created_by' => $this->admin->id,
            'updated_by' => $this->admin->id,
        ]);

        $incidencia2 = Incidencia::create([
            'incidencia_descripcion' => 'Incidencia Tipo 2',
            'direccion_id' => $this->direccion->id,
            'tipo_incidencia_id' => $otroTipo->id,
            'estado_id' => $this->estadoRevision->id,
            'version' => 1,
            'cliente_id' => $this->admin->id,
            'institucion_id' => $this->policia->id,
            'created_by' => $this->admin->id,
            'updated_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->getJson("/api/v1/incidencias?tipo_incidencia_id={$otroTipo->id}");

        $response->assertStatus(200);
        $data = $response->json();

        $containsIncidencia1 = collect($data)->contains('id', $incidencia1->id);
        $containsIncidencia2 = collect($data)->contains('id', $incidencia2->id);

        $this->assertFalse($containsIncidencia1);
        $this->assertTrue($containsIncidencia2);
    }
    // CP-V-01: Latitud fuera de rango
    public function test_validates_latitud_out_of_range()
    {
        $payload = [
            'territorio_id' => $this->territorio->id,
            'detalle' => 'Calle Falsa 123',
            'latitud' => 95.0, // Fuera de rango (-90 a 90)
            'longitud' => -80.0,
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/v1/direcciones', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['latitud']);
    }

    // CP-V-02: Longitud fuera de rango
    public function test_validates_longitud_out_of_range()
    {
        $payload = [
            'territorio_id' => $this->territorio->id,
            'detalle' => 'Calle Falsa 123',
            'latitud' => -2.2,
            'longitud' => 200.0, // Fuera de rango (-180 a 180)
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/v1/direcciones', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['longitud']);
    }

    // CP-V-03: Campos obligatorios vacíos
    public function test_validates_required_fields_on_incidencia()
    {
        $payload = [
            // Falta tipo_incidencia_id y sub_tipo_incidencia_id
            'incidencia_descripcion' => 'Descripción',
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/v1/incidencias', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['tipo_incidencia_id', 'sub_tipo_incidencia_id']);
    }

    // CP-V-05: Tipo/Subtipo inválido (no existe)
    public function test_validates_tipo_and_subtipo_exist()
    {
        $payload = [
            'tipo_incidencia_id' => 9999, // Inexistente
            'sub_tipo_incidencia_id' => 9999, // Inexistente
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/v1/incidencias', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['tipo_incidencia_id', 'sub_tipo_incidencia_id']);
    }

    // CP-G-01: Agrupamiento de incidencias y aumento de afectados dentro del umbral
    public function test_incidents_within_threshold_group_and_increment_affected_count()
    {
        $direccionOriginal = Direccion::create([
            'territorio_id' => $this->territorio->id,
            'detalle' => 'Direccion Original',
            'latitud' => -2.200000,
            'longitud' => -79.900000,
            'activo' => true,
        ]);

        $incidenciaOriginal = Incidencia::create([
            'incidencia_descripcion' => 'Incidencia Original',
            'direccion_id' => $direccionOriginal->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'estado_id' => $this->estadoRevision->id, // "En Revisión" = 2
            'cantidad_afectados_incidencia' => 1,
            'version' => 1,
            'cliente_id' => $this->admin->id,
            'created_by' => $this->admin->id,
        ]);

        // Crear una nueva dirección a ~11 metros (dentro de los 50 metros)
        // Usamos -2.2001, que es aproximadamente 11 metros de distancia
        $direccionCercana = Direccion::create([
            'territorio_id' => $this->territorio->id,
            'detalle' => 'Direccion Cercana',
            'latitud' => -2.200100,
            'longitud' => -79.900000,
            'activo' => true,
        ]);

        $payload = [
            'direccion_id' => $direccionCercana->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'incidencia_descripcion' => 'Incidencia duplicada cercana',
            'cantidad_afectados_incidencia' => 1,
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/v1/incidencias', $payload);

        $response->assertStatus(200); // Retorna 200 al agrupar
        $response->assertJsonPath('data.id', $incidenciaOriginal->id);

        // Verificar base de datos
        $this->assertEquals(2, $incidenciaOriginal->fresh()->cantidad_afectados_incidencia);

        // Verificar que la dirección duplicada fue eliminada
        $this->assertNull(Direccion::find($direccionCercana->id));
    }

    public function test_incidents_outside_threshold_do_not_group()
    {
        $direccionOriginal = Direccion::create([
            'territorio_id' => $this->territorio->id,
            'detalle' => 'Direccion Original',
            'latitud' => -2.200000,
            'longitud' => -79.900000,
            'activo' => true,
        ]);

        $incidenciaOriginal = Incidencia::create([
            'incidencia_descripcion' => 'Incidencia Original',
            'direccion_id' => $direccionOriginal->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'estado_id' => $this->estadoRevision->id,
            'cantidad_afectados_incidencia' => 1,
            'version' => 1,
            'cliente_id' => $this->admin->id,
            'created_by' => $this->admin->id,
        ]);

        // Crear dirección a ~1.1 km de distancia
        $direccionLejana = Direccion::create([
            'territorio_id' => $this->territorio->id,
            'detalle' => 'Direccion Lejana',
            'latitud' => -2.210000,
            'longitud' => -79.900000,
            'activo' => true,
        ]);

        $payload = [
            'direccion_id' => $direccionLejana->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'incidencia_descripcion' => 'Nueva incidencia lejana',
            'cantidad_afectados_incidencia' => 1,
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/v1/incidencias', $payload);

        $response->assertStatus(201); // Crea una nueva

        // Verificar base de datos
        $this->assertEquals(1, $incidenciaOriginal->fresh()->cantidad_afectados_incidencia);
        $this->assertNotNull(Direccion::find($direccionLejana->id));
        $this->assertDatabaseHas('reporte_incidencias', [
            'direccion_id' => $direccionLejana->id,
            'incidencia_descripcion' => 'Nueva incidencia lejana'
        ]);
    }

    public function test_citizen_can_view_grouped_incident_where_they_are_reportante()
    {
        $ciudadano1 = User::factory()->create();
        $ciudadano2 = User::factory()->create();

        // Crear rol Ciudadano y sus permisos correspondientes para que pase el middleware CheckResourcePermission
        $ciudadanoRole = Role::firstOrCreate(['nombre' => 'Ciudadano'], ['descripcion' => 'Rol de ciudadanos', 'created_by' => $ciudadano1->id]);

        $opcion = OpcionMenu::firstOrCreate(
            ['nombre' => 'Incidencias'],
            ['ruta' => '/incidencias', 'created_by' => $ciudadano1->id]
        );

        $permisoReadInc = Permiso::firstOrCreate(
            ['accion' => 'READ', 'recurso' => 'incidencias'],
            ['nombre' => 'Consultar incidencias', 'descripcion' => 'Permiso para consultar incidencias', 'opcion_menu_id' => $opcion->id, 'created_by' => $ciudadano1->id]
        );

        $permisoReadHist = Permiso::firstOrCreate(
            ['accion' => 'READ', 'recurso' => 'historial'],
            ['nombre' => 'Consultar historial', 'descripcion' => 'Permiso para consultar historial', 'opcion_menu_id' => $opcion->id, 'created_by' => $ciudadano1->id]
        );

        $ciudadanoRole->permisos()->sync([$permisoReadInc->id, $permisoReadHist->id]);

        $ciudadano1->roles()->sync([$ciudadanoRole->id]);
        $ciudadano2->roles()->sync([$ciudadanoRole->id]);

        $direccion = Direccion::create([
            'territorio_id' => $this->territorio->id,
            'detalle' => 'Av. Amazonas',
            'activo' => true,
        ]);

        // Creado por Ciudadano 1
        $incidencia = Incidencia::create([
            'incidencia_descripcion' => 'Bache gigante',
            'direccion_id' => $direccion->id,
            'tipo_incidencia_id' => $this->categoriaPadre->id,
            'sub_tipo_incidencia_id' => $this->subcategoriaAlta->id,
            'estado_id' => $this->estadoRevision->id,
            'cantidad_afectados_incidencia' => 1,
            'version' => 1,
            'cliente_id' => $ciudadano1->id,
            'created_by' => $ciudadano1->id,
        ]);

        $incidencia->reportantes()->attach($ciudadano1->id, ['created_by' => $ciudadano1->id]);

        // Asociar Ciudadano 2 como reportante (agrupado)
        $incidencia->reportantes()->attach($ciudadano2->id, ['created_by' => $ciudadano2->id]);

        // Ciudadano 2 intenta ver la incidencia
        $response = $this->actingAs($ciudadano2)->getJson("/api/v1/incidencias/{$incidencia->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('id', $incidencia->id);

        // Ciudadano 2 intenta ver el historial/comentarios
        $responseHistorial = $this->actingAs($ciudadano2)->getJson("/api/v1/incidencias/{$incidencia->id}/historial");
        $responseHistorial->assertStatus(200);
    }
}
