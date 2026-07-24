<?php

namespace Tests\Feature;

use App\Models\OpcionMenu;
use App\Models\Permiso;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PermisoTest extends TestCase
{
    const string ENDPOINT_PERMISSIONS = '/api/v1/permissions';

    const string ASSERT_PERMISSION_NAME = 'Nuevo Permiso';

    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = $this->createAdminUser();
        Sanctum::actingAs($this->admin);
    }

    public function test_index_returns_permisos()
    {
        Permiso::create(['nombre' => 'P1', 'accion' => 'ver', 'recurso' => 'r1']);
        $response = $this->getJson('/api/v1/permissions');
        $response->assertStatus(200);
        $this->assertArrayHasKey('data', $response->json());
    }

    public function test_index_returns_all_without_pagination()
    {
        Permiso::create(['nombre' => 'P1', 'accion' => 'ver', 'recurso' => 'r1']);
        $response = $this->getJson('/api/v1/permissions?all=true');
        $response->assertStatus(200);
        $this->assertIsArray($response->json());
    }

    public function test_store_creates_permiso()
    {
        $response = $this->postJson(self::ENDPOINT_PERMISSIONS, [
            'nombre' => 'Nuevo Permiso',
            'accion' => 'crear',
            'recurso' => 'prueba',
        ]);

        $response->assertStatus(201)->assertJsonFragment(['nombre' => self::ASSERT_PERMISSION_NAME]);
        $this->assertDatabaseHas('permisos', ['nombre' => self::ASSERT_PERMISSION_NAME]);
    }

    public function test_store_derives_recurso_from_opcion_menu()
    {
        $opcion = OpcionMenu::create(['nombre' => 'Op', 'ruta' => '#/mi-recurso', 'icono' => 'icon']);

        $response = $this->postJson(self::ENDPOINT_PERMISSIONS, [
            'nombre' => 'Perm',
            'accion' => 'ver',
            'opcion_menu_id' => $opcion->id,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('permisos', ['nombre' => 'Perm', 'recurso' => 'mi_recurso']);
    }

    public function test_show_returns_permiso()
    {
        $perm = Permiso::create(['nombre' => 'PS', 'accion' => 'ver', 'recurso' => 'rs']);
        $response = $this->getJson(self::ENDPOINT_PERMISSIONS.'/'.$perm->id);
        $response->assertStatus(200)->assertJsonFragment(['nombre' => 'PS']);
    }

    public function test_update_modifies_permiso()
    {
        $perm = Permiso::create(['nombre' => 'Old', 'accion' => 'ver', 'recurso' => 'rs']);
        $response = $this->putJson(self::ENDPOINT_PERMISSIONS.'/'.$perm->id, [
            'nombre' => 'New',
        ]);
        $response->assertStatus(200)->assertJsonFragment(['nombre' => 'New']);
        $this->assertDatabaseHas('permisos', ['id' => $perm->id, 'nombre' => 'New']);
    }

    public function test_destroy_deletes_permiso()
    {
        $perm = Permiso::create(['nombre' => 'Del', 'accion' => 'ver', 'recurso' => 'rs']);
        $response = $this->deleteJson(self::ENDPOINT_PERMISSIONS.'/'.$perm->id);
        $response->assertStatus(200);
        $this->assertDatabaseMissing('permisos', ['id' => $perm->id, 'deleted_at' => null]);
    }
}
