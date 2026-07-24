<?php

namespace Tests\Feature;

use App\Models\Permiso;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/v1/roles';

    private const TABLE = 'roles';

    private const ATTR_NOMBRE = 'nombre';

    private const ATTR_DESC = 'descripcion';

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = $this->createAdminUser();
        Sanctum::actingAs($this->admin);
    }

    public function test_index_returns_roles()
    {
        $response = $this->getJson(self::ENDPOINT);
        $response->assertStatus(200);
        $this->assertArrayHasKey('data', $response->json());
    }

    public function test_index_returns_all_without_pagination()
    {
        $response = $this->getJson(self::ENDPOINT.'?all=true');
        $response->assertStatus(200);
        $this->assertIsArray($response->json());
    }

    public function test_store_creates_role()
    {
        $response = $this->postJson(self::ENDPOINT, [
            self::ATTR_NOMBRE => 'Test Role',
            self::ATTR_DESC => 'Desc',
        ]);

        $response->assertStatus(201)->assertJsonFragment([self::ATTR_NOMBRE => 'Test Role']);
        $this->assertDatabaseHas(self::TABLE, [self::ATTR_NOMBRE => 'Test Role']);
    }

    public function test_show_returns_role()
    {
        $role = Role::create([self::ATTR_NOMBRE => 'Show Role', self::ATTR_DESC => 'S', 'created_by' => $this->admin->id]);
        $response = $this->getJson(self::ENDPOINT.'/'.$role->id);
        $response->assertStatus(200)->assertJsonFragment([self::ATTR_NOMBRE => 'Show Role']);
    }

    public function test_update_modifies_role()
    {
        $role = Role::create([self::ATTR_NOMBRE => 'Old', self::ATTR_DESC => 'O', 'created_by' => $this->admin->id]);
        $response = $this->putJson(self::ENDPOINT.'/'.$role->id, [
            self::ATTR_NOMBRE => 'New',
        ]);
        $response->assertStatus(200)->assertJsonFragment([self::ATTR_NOMBRE => 'New']);
        $this->assertDatabaseHas(self::TABLE, ['id' => $role->id, self::ATTR_NOMBRE => 'New']);
    }

    public function test_destroy_deletes_role()
    {
        $role = Role::create([self::ATTR_NOMBRE => 'Del', self::ATTR_DESC => 'D', 'created_by' => $this->admin->id]);
        $response = $this->deleteJson(self::ENDPOINT.'/'.$role->id);
        $response->assertStatus(200);
        $this->assertDatabaseMissing(self::TABLE, ['id' => $role->id, 'deleted_at' => null]);
    }

    public function test_assign_permissions_updates_role_permissions()
    {
        $role = Role::create([self::ATTR_NOMBRE => 'Target', self::ATTR_DESC => 'T', 'created_by' => $this->admin->id]);
        $permiso = Permiso::create([self::ATTR_NOMBRE => 'Perm', 'accion' => 'ver', 'recurso' => 'test']);

        $response = $this->postJson(self::ENDPOINT.'/'.$role->id.'/permissions', [
            'permisos' => [$permiso->id],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('roles_permisos', [
            'rol_id' => $role->id,
            'permiso_id' => $permiso->id,
        ]);
    }
}
