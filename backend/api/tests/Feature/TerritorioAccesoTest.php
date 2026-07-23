<?php

namespace Tests\Feature;

use App\Enums\PermissionsEnum;
use App\Enums\TipoTerritorio;
use App\Models\Direccion;
use App\Models\EstadoIncidencia;
use App\Models\Incidencia;
use App\Models\OpcionMenu;
use App\Models\Pais;
use App\Models\Permiso;
use App\Models\Prioridad;
use App\Models\Role;
use App\Models\Territorio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TerritorioAccesoTest extends TestCase
{
    use RefreshDatabase;

    public function test_supervisor_only_sees_incidents_in_assigned_territories_and_descendants()
    {
        // 1. Setup countries and territories
        $ecuador = Pais::create([
            'nombre' => 'Ecuador',
            'codigo_iso' => 'EC',
            'activo' => true,
        ]);

        // Azuay -> Cuenca -> Bellavista
        $azuay = Territorio::create([
            'pais_id' => $ecuador->id,
            'parent_id' => null,
            'nombre' => 'Azuay',
            'tipo' => TipoTerritorio::PROVINCIA,
            'codigo' => '1',
        ]);

        $cuenca = Territorio::create([
            'pais_id' => $ecuador->id,
            'parent_id' => $azuay->id,
            'nombre' => 'Cuenca',
            'tipo' => TipoTerritorio::CANTON,
            'codigo' => '101',
        ]);

        $bellavista = Territorio::create([
            'pais_id' => $ecuador->id,
            'parent_id' => $cuenca->id,
            'nombre' => 'Bellavista',
            'tipo' => TipoTerritorio::PARROQUIA,
            'codigo' => '10101',
        ]);

        // Guayas (unrelated)
        $guayas = Territorio::create([
            'pais_id' => $ecuador->id,
            'parent_id' => null,
            'nombre' => 'Guayas',
            'tipo' => TipoTerritorio::PROVINCIA,
            'codigo' => '9',
        ]);

        // 2. Setup addresses
        $dirAzuay = Direccion::create([
            'territorio_id' => $bellavista->id,
            'detalle' => 'Calle Gran Colombia',
            'referencia' => 'Azuay',
            'latitud' => -2.8974,
            'longitud' => -79.0045,
        ]);

        $dirGuayas = Direccion::create([
            'territorio_id' => $guayas->id,
            'detalle' => 'Av. 9 de Octubre',
            'referencia' => 'Guayas',
            'latitud' => -2.1961,
            'longitud' => -79.8862,
        ]);

        // 3. Setup Users, Roles, States, and Priorities
        $estadoPendiente = EstadoIncidencia::firstOrCreate(['nombre' => 'Pendiente'], ['descripcion' => 'Pendiente']);
        EstadoIncidencia::firstOrCreate(['nombre' => 'En Revisión'], ['descripcion' => 'En Revisión']);
        $prioridadBaja = Prioridad::firstOrCreate(['nombre' => 'Baja'], ['color_hex' => '#0d6efd']);

        $supervisor = User::factory()->create(['pais_id' => $ecuador->id]);
        $rolSupervisor = Role::firstOrCreate(['nombre' => 'Supervisor'], [
            'descripcion' => 'Supervisor',
            'created_by' => $supervisor->id,
        ]);

        $opcionMenu = OpcionMenu::firstOrCreate(
            ['nombre' => 'Incidencias'],
            [
                'ruta' => '/incidencias',
                'icono' => 'incident',
                'created_by' => $supervisor->id,
            ]
        );

        $permissionEnum = PermissionsEnum::READ_INCIDENCIAS;
        [$accion, $recursoUpper] = explode('_', $permissionEnum->name, 2);
        $recurso = strtolower($recursoUpper);

        $permisoRead = Permiso::firstOrCreate(
            ['accion' => $accion, 'recurso' => $recurso],
            [
                'nombre' => $permissionEnum->value,
                'descripcion' => 'Permite ver las incidencias',
                'created_by' => $supervisor->id,
                'opcion_menu_id' => $opcionMenu->id,
            ]
        );
        $rolSupervisor->permisos()->sync([$permisoRead->id]);

        $supervisor->roles()->sync([$rolSupervisor->id]);

        // Assign Azuay to Supervisor
        $supervisor->territorios()->sync([$azuay->id]);

        // 4. Create Incidents
        $incidenciaAzuay = Incidencia::create([
            'incidencia_descripcion' => 'Incidencia en Azuay (Bellavista)',
            'direccion_id' => $dirAzuay->id,
            'estado_id' => $estadoPendiente->id,
            'prioridad_id' => $prioridadBaja->id,
            'version' => 1,
        ]);

        $incidenciaGuayas = Incidencia::create([
            'incidencia_descripcion' => 'Incidencia en Guayas',
            'direccion_id' => $dirGuayas->id,
            'estado_id' => $estadoPendiente->id,
            'prioridad_id' => $prioridadBaja->id,
            'version' => 1,
        ]);

        // 5. Query indices as Supervisor
        $response = $this->actingAs($supervisor)->getJson('/api/v1/incidents');

        // 6. Assertions
        $response->assertStatus(200);
        $data = $response->json('data');

        // Supervisor should see the Azuay incident (which transitioned to "En Revisión" = 2)
        $this->assertTrue(
            collect($data)->contains('id', $incidenciaAzuay->id),
            'Supervisor should see Azuay incident'
        );

        // Supervisor should NOT see the Guayas incident
        $this->assertFalse(
            collect($data)->contains('id', $incidenciaGuayas->id),
            'Supervisor should NOT see Guayas incident'
        );

        // 7. Verify checkAccess via direct show request
        $responseShowAzuay = $this->actingAs($supervisor)->getJson("/api/v1/incidents/{$incidenciaAzuay->id}");
        $responseShowAzuay->assertStatus(200);

        $responseShowGuayas = $this->actingAs($supervisor)->getJson("/api/v1/incidents/{$incidenciaGuayas->id}");
        $responseShowGuayas->assertStatus(403);
    }
}
