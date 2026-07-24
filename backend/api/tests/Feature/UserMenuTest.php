<?php

namespace Tests\Feature;

use App\Models\OpcionMenu;
use App\Models\Permiso;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserMenuTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/v1/me/menu';

    private const ATTR_NOMBRE = 'nombre';

    public function test_index_returns_all_for_admin()
    {
        $admin = $this->createAdminUser();
        OpcionMenu::create([self::ATTR_NOMBRE => 'TestMenu1', 'ruta' => '/test1', 'icono' => 'icon', 'created_by' => $admin->id]);

        Sanctum::actingAs($admin);

        $response = $this->getJson(self::ENDPOINT);
        $response->assertStatus(200);
        $this->assertGreaterThan(0, count($response->json('data')));
    }

    public function test_index_filters_for_non_admin()
    {
        $user = User::factory()->create();
        $role = Role::create([self::ATTR_NOMBRE => 'User Role', 'descripcion' => 'Rol usuario', 'created_by' => $user->id]);
        $user->roles()->attach($role->id);

        $menu = OpcionMenu::create([self::ATTR_NOMBRE => 'TestMenu2', 'ruta' => '/test2', 'icono' => 'icon', 'created_by' => $user->id]);
        $permiso = Permiso::create([self::ATTR_NOMBRE => 'P1', 'accion' => 'ver', 'recurso' => 'test2', 'opcion_menu_id' => $menu->id, 'created_by' => $user->id]);
        $role->permisos()->attach($permiso->id);

        Sanctum::actingAs($user);

        $response = $this->getJson(self::ENDPOINT);
        $response->assertStatus(200);

        $nombres = collect($response->json('data'))->pluck(self::ATTR_NOMBRE)->toArray();
        $this->assertContains('TestMenu2', $nombres);
    }

    public function test_index_returns_401_when_not_authenticated()
    {
        $response = $this->getJson(self::ENDPOINT);
        $response->assertStatus(401);
    }
}
