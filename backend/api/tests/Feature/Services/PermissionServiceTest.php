<?php

namespace Tests\Feature\Services;

use App\Enums\PermissionsEnum;
use App\Models\Permiso;
use App\Models\Role;
use App\Models\User;
use App\Services\PermissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_grant_permissions_to_role()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $role = Role::create(['nombre' => 'Test Role', 'descripcion' => 'Test', 'created_by' => $user->id]);

        $permiso = Permiso::create([
            'nombre' => PermissionsEnum::READ_INCIDENCIAS->value,
            'accion' => 'READ',
            'recurso' => 'incidencias',
            'descripcion' => 'Ver incidencias',
            'created_by' => $user->id,
        ]);

        $service = new PermissionService;
        $service->grantPermissionsToRole($role, [PermissionsEnum::READ_INCIDENCIAS]);

        $this->assertTrue($role->permisos->contains($permiso));
    }

    public function test_sync_permissions_to_role()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $role = Role::create(['nombre' => 'Test Role', 'descripcion' => 'Test', 'created_by' => $user->id]);

        $permiso1 = Permiso::create(['nombre' => 'Perm1', 'accion' => 'A1', 'recurso' => 'R1', 'descripcion' => 'Desc1', 'created_by' => $user->id]);
        $permiso2 = Permiso::create(['nombre' => 'Perm2', 'accion' => 'A2', 'recurso' => 'R2', 'descripcion' => 'Desc2', 'created_by' => $user->id]);

        $service = new PermissionService;
        $service->syncPermissionsToRole($role, [$permiso1->id, $permiso2->id]);

        $role->refresh();
        $this->assertTrue($role->permisos->contains($permiso1));
        $this->assertTrue($role->permisos->contains($permiso2));
        $this->assertCount(2, $role->permisos);
    }

    public function test_user_has_permission()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $role = Role::create(['nombre' => 'Admin', 'descripcion' => 'Admin role', 'created_by' => $user->id]);
        $permiso = Permiso::create([
            'nombre' => PermissionsEnum::READ_INCIDENCIAS->value,
            'accion' => 'READ',
            'recurso' => 'incidencias',
            'descripcion' => 'Ver incidencias',
            'created_by' => $user->id,
        ]);

        $role->permisos()->attach($permiso);
        $user->roles()->attach($role);

        $user->load('roles.permisos');

        $service = new PermissionService;
        $this->assertTrue($service->userHasPermission($user, PermissionsEnum::READ_INCIDENCIAS));
    }

    public function test_user_does_not_have_permission()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $role = Role::create(['nombre' => 'Admin', 'descripcion' => 'Admin role', 'created_by' => $user->id]);

        $user->roles()->attach($role);
        $user->load('roles.permisos');

        $service = new PermissionService;
        $this->assertFalse($service->userHasPermission($user, PermissionsEnum::READ_INCIDENCIAS));
    }
}
