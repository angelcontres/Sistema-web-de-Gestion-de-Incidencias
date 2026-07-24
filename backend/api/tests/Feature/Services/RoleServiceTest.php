<?php

namespace Tests\Feature\Services;

use App\Models\Role;
use App\Models\User;
use App\Services\RoleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_all_roles()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        
        Role::create(['nombre' => 'Role 1', 'descripcion' => 'Desc 1', 'created_by' => $user->id]);
        Role::create(['nombre' => 'Role 2', 'descripcion' => 'Desc 2', 'created_by' => $user->id]);

        $service = new RoleService();
        $roles = $service->getAllRoles();

        $this->assertCount(2, $roles);
    }

    public function test_get_role_by_id()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        
        $role = Role::create(['nombre' => 'Role 1', 'descripcion' => 'Desc 1', 'created_by' => $user->id]);

        $service = new RoleService();
        $foundRole = $service->getRoleById($role->id);

        $this->assertNotNull($foundRole);
        $this->assertEquals($role->id, $foundRole->id);
    }

    public function test_assign_role_to_user()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        
        $role = Role::create(['nombre' => 'Admin', 'descripcion' => 'Admin role', 'created_by' => $user->id]);

        $service = new RoleService();
        $service->assignRoleToUser($user, 'Admin');

        $this->assertTrue($user->roles->contains($role));
    }

    public function test_assign_non_existent_role_to_user()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        
        $service = new RoleService();
        $service->assignRoleToUser($user, 'NonExistentRole');

        $this->assertEmpty($user->roles);
    }

    public function test_sync_roles_to_user()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        
        $role1 = Role::create(['nombre' => 'Role 1', 'descripcion' => 'Desc 1', 'created_by' => $user->id]);
        $role2 = Role::create(['nombre' => 'Role 2', 'descripcion' => 'Desc 2', 'created_by' => $user->id]);

        $service = new RoleService();
        $service->syncRolesToUser($user, [$role1->id, $role2->id]);

        $user->refresh();
        $this->assertTrue($user->roles->contains($role1));
        $this->assertTrue($user->roles->contains($role2));
        $this->assertCount(2, $user->roles);
    }
}
