<?php

namespace Tests\Feature;

use App\Models\OpcionMenu;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpcionMenuTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        // Create an admin user to bypass permission checks in tests
        $this->user = $this->createAdminUser();
    }

    public function test_can_list_menu_options_flat()
    {
        $padre = OpcionMenu::create([
            'nombre' => 'Configuración',
            'ruta' => '/config',
            'created_by' => $this->user->id,
        ]);

        $hijo = OpcionMenu::create([
            'nombre' => 'Usuarios',
            'ruta' => '/config/usuarios',
            'padre_id' => $padre->id,
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/v1/opciones-menu');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    '*' => ['id', 'nombre', 'icono', 'ruta', 'padre_id', 'created_by'],
                ],
            ])
            ->assertJsonCount(2, 'data');
    }

    public function test_can_list_menu_options_as_tree()
    {
        $padre = OpcionMenu::create([
            'nombre' => 'Configuración',
            'ruta' => '/config',
            'created_by' => $this->user->id,
        ]);

        $hijo = OpcionMenu::create([
            'nombre' => 'Usuarios',
            'ruta' => '/config/usuarios',
            'padre_id' => $padre->id,
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/v1/opciones-menu?tree=true');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data') // only root option
            ->assertJsonPath('data.0.nombre', 'Configuración')
            ->assertJsonPath('data.0.hijos.0.nombre', 'Usuarios');
    }

    public function test_can_create_menu_option()
    {
        $payload = [
            'nombre' => 'Reportes',
            'icono' => 'chart-bar',
            'ruta' => '/reportes',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/v1/opciones-menu', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.nombre', 'Reportes')
            ->assertJsonPath('data.created_by', $this->user->id);

        $this->assertDatabaseHas('opciones_menu', [
            'nombre' => 'Reportes',
            'created_by' => $this->user->id,
        ]);
    }

    public function test_cannot_create_menu_option_with_invalid_parent()
    {
        $payload = [
            'nombre' => 'Reportes',
            'ruta' => '/reportes',
            'padre_id' => 999, // non-existent
        ];

        $response = $this->actingAs($this->user)->postJson('/api/v1/opciones-menu', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['padre_id']);
    }

    public function test_can_show_menu_option()
    {
        $opcion = OpcionMenu::create([
            'nombre' => 'Dashboard',
            'ruta' => '/dashboard',
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->getJson("/api/v1/opciones-menu/{$opcion->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.nombre', 'Dashboard');
    }

    public function test_can_update_menu_option()
    {
        $opcion = OpcionMenu::create([
            'nombre' => 'Dashboard',
            'ruta' => '/dashboard',
            'created_by' => $this->user->id,
        ]);

        $payload = [
            'nombre' => 'Panel Principal',
        ];

        $response = $this->actingAs($this->user)->putJson("/api/v1/opciones-menu/{$opcion->id}", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('data.nombre', 'Panel Principal')
            ->assertJsonPath('data.updated_by', $this->user->id);

        $this->assertDatabaseHas('opciones_menu', [
            'id' => $opcion->id,
            'nombre' => 'Panel Principal',
            'updated_by' => $this->user->id,
        ]);
    }

    public function test_cannot_set_menu_option_as_its_own_parent()
    {
        $opcion = OpcionMenu::create([
            'nombre' => 'Dashboard',
            'ruta' => '/dashboard',
            'created_by' => $this->user->id,
        ]);

        $payload = [
            'padre_id' => $opcion->id,
        ];

        $response = $this->actingAs($this->user)->putJson("/api/v1/opciones-menu/{$opcion->id}", $payload);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'Una opción de menú no puede ser su propio padre.');
    }

    public function test_can_soft_delete_menu_option()
    {
        $padre = OpcionMenu::create([
            'nombre' => 'Configuración',
            'ruta' => '/config',
            'created_by' => $this->user->id,
        ]);

        $hijo = OpcionMenu::create([
            'nombre' => 'Usuarios',
            'ruta' => '/config/usuarios',
            'padre_id' => $padre->id,
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/v1/opciones-menu/{$padre->id}");

        $response->assertStatus(200);

        // Verify padre is soft-deleted and deleted_by is logged
        $this->assertSoftDeleted('opciones_menu', [
            'id' => $padre->id,
            'deleted_by' => $this->user->id,
        ]);

        // Verify hijo's padre_id is set to null
        $this->assertDatabaseHas('opciones_menu', [
            'id' => $hijo->id,
            'padre_id' => null,
        ]);
    }
}
