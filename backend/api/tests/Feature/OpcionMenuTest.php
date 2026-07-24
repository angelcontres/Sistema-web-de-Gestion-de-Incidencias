<?php

namespace Tests\Feature;

use App\Models\OpcionMenu;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpcionMenuTest extends TestCase
{
    const string CONFIGURACION_OPTION_NAME = 'Configuración';
    const string USUARIOS_OPTION_NAME = 'Usuarios';
    const string DASHBOARD_OPTION_NAME = 'Dashboard';
    const string REPORTES_OPTION_NAME = 'Reportes';
    const string ENDPOINT_MENU_OPTIONS = '/api/v1/menu-options';
    const string MENU_OPTION_ROUTE_DASHBOARD = '/dashboard';
    const string PANEL_PRINCIPAL_NAME = 'Panel Principal';
    const string ROUTE_CONFIG = '/config';
    const string ROUTE_CONFIG_USER = '/config/usuarios';

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
            'nombre' => self::CONFIGURACION_OPTION_NAME,
            'ruta' => self::ROUTE_CONFIG,
            'created_by' => $this->user->id,
        ]);

        OpcionMenu::create([
            'nombre' => self::USUARIOS_OPTION_NAME,
            'ruta' => self::ROUTE_CONFIG_USER,
            'padre_id' => $padre->id,
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->getJson(self::ENDPOINT_MENU_OPTIONS);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'current_page',
                'data' => [
                    '*' => ['id', 'nombre', 'icono', 'ruta', 'padre_id', 'created_by'],
                ],
            ])
            ->assertJsonCount(2, 'data');
    }

    public function test_can_list_menu_options_as_tree()
    {
        $padre = OpcionMenu::create([
            'nombre' => self::CONFIGURACION_OPTION_NAME,
            'ruta' => self::ROUTE_CONFIG,
            'created_by' => $this->user->id,
        ]);

        OpcionMenu::create([
            'nombre' => 'Usuarios',
            'ruta' => self::ROUTE_CONFIG_USER,
            'padre_id' => $padre->id,
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->getJson(self::ENDPOINT_MENU_OPTIONS . '?tree=true');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data') // only root option
            ->assertJsonPath('data.0.nombre', self::CONFIGURACION_OPTION_NAME)
            ->assertJsonPath('data.0.hijos.0.nombre', self::USUARIOS_OPTION_NAME);
    }

    public function test_can_create_menu_option()
    {
        $payload = [
            'nombre' => 'Reportes',
            'icono' => 'chart-bar',
            'ruta' => '/reportes',
        ];

        $response = $this->actingAs($this->user)->postJson(self::ENDPOINT_MENU_OPTIONS, $payload);

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

        $response = $this->actingAs($this->user)->postJson(self::ENDPOINT_MENU_OPTIONS, $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['padre_id']);
    }

    public function test_can_show_menu_option()
    {
        $opcion = OpcionMenu::create([
            'nombre' => self::DASHBOARD_OPTION_NAME,
            'ruta' => self::MENU_OPTION_ROUTE_DASHBOARD,
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->getJson(self::ENDPOINT_MENU_OPTIONS . "/{$opcion->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.nombre', self::DASHBOARD_OPTION_NAME);
    }

    public function test_can_update_menu_option()
    {
        $opcion = OpcionMenu::create([
            'nombre' => self::DASHBOARD_OPTION_NAME,
            'ruta' => self::MENU_OPTION_ROUTE_DASHBOARD,
            'created_by' => $this->user->id,
        ]);

        $payload = [
            'nombre' => self::PANEL_PRINCIPAL_NAME,
        ];

        $response = $this->actingAs($this->user)->putJson(self::ENDPOINT_MENU_OPTIONS . "/{$opcion->id}", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('data.nombre', self::PANEL_PRINCIPAL_NAME)
            ->assertJsonPath('data.updated_by', $this->user->id);

        $this->assertDatabaseHas('opciones_menu', [
            'id' => $opcion->id,
            'nombre' => self::PANEL_PRINCIPAL_NAME,
            'updated_by' => $this->user->id,
        ]);
    }

    public function test_cannot_set_menu_option_as_its_own_parent()
    {
        $opcion = OpcionMenu::create([
            'nombre' => self::DASHBOARD_OPTION_NAME,
        'ruta' => self::MENU_OPTION_ROUTE_DASHBOARD,
            'created_by' => $this->user->id,
        ]);

        $payload = [
            'padre_id' => $opcion->id,
        ];

        $response = $this->actingAs($this->user)->putJson(self::ENDPOINT_MENU_OPTIONS . "/{$opcion->id}", $payload);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'Una opción de menú no puede ser su propio padre.');
    }

    public function test_can_soft_delete_menu_option()
    {
        $padre = OpcionMenu::create([
            'nombre' => self::CONFIGURACION_OPTION_NAME,
            'ruta' => self::ROUTE_CONFIG,
            'created_by' => $this->user->id,
        ]);

        $hijo = OpcionMenu::create([
            'nombre' => 'Usuarios',
            'ruta' => self::ROUTE_CONFIG_USER,
            'padre_id' => $padre->id,
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->deleteJson(self::ENDPOINT_MENU_OPTIONS . "/{$padre->id}");

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
