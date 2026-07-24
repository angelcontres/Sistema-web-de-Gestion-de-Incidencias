<?php

namespace Tests\Feature\Models;

use App\Models\Permiso;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_relations()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        
        $role = Role::create([
            'nombre' => 'Test Role',
            'descripcion' => 'Test',
            'created_by' => $user->id,
        ]);

        $permiso = Permiso::create([
            'nombre' => 'Test Permiso',
            'accion' => 'CREATE',
            'recurso' => 'test',
        ]);
        
        $role->permisos()->attach($permiso);
        $role->users()->attach($user);

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsTo::class, $role->RoleCreater());
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsTo::class, $role->RoleEditor());
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsTo::class, $role->RoleDeleter());

        $this->assertTrue($role->permisos->contains($permiso));
        $this->assertTrue($role->users->contains($user));
    }
}
