<?php

namespace Tests\Feature\Models;

use App\Models\OpcionMenu;
use App\Models\Permiso;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermisoModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_permiso_relations()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $opcion = OpcionMenu::create(['nombre' => 'Test Opcion', 'ruta' => '/test', 'icono' => 'icon']);

        $permiso = Permiso::create([
            'nombre' => 'Test Permiso',
            'accion' => 'CREATE',
            'recurso' => 'test',
            'created_by' => $user->id,
            'updated_by' => $user->id,
            'deleted_by' => $user->id,
            'opcion_menu_id' => $opcion->id,
        ]);

        $role = Role::create([
            'nombre' => 'Test Role',
            'descripcion' => 'Test',
            'created_by' => $user->id,
        ]);

        $permiso->roles()->attach($role);

        $this->assertInstanceOf(User::class, $permiso->PermisoCreater);
        $this->assertEquals($user->id, $permiso->PermisoCreater->id);

        $this->assertInstanceOf(User::class, $permiso->PermisoEditor);
        $this->assertEquals($user->id, $permiso->PermisoEditor->id);

        $this->assertInstanceOf(User::class, $permiso->PermisoDeleter);
        $this->assertEquals($user->id, $permiso->PermisoDeleter->id);

        $this->assertInstanceOf(OpcionMenu::class, $permiso->opcionMenu);
        $this->assertEquals($opcion->id, $permiso->opcionMenu->id);

        $this->assertTrue($permiso->roles->contains($role));
    }
}
