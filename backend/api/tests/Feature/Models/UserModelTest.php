<?php

namespace Tests\Feature\Models;

use App\Models\Institucion;
use App\Models\Pais;
use App\Models\Permiso;
use App\Models\Role;
use App\Models\Territorio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_relationships()
    {
        $pais = Pais::create(['nombre' => 'Pais T', 'codigo_iso' => 'PT']);
        $institucion = Institucion::create(['nombre' => 'Inst T', 'siglas' => 'IT']);

        $user = User::factory()->create([
            'pais_id' => $pais->id,
            'institucion_id' => $institucion->id,
        ]);

        $this->assertInstanceOf(Pais::class, $user->pais);
        $this->assertEquals($pais->id, $user->pais->id);

        $this->assertInstanceOf(Institucion::class, $user->institucion);
        $this->assertEquals($institucion->id, $user->institucion->id);

        $role = Role::create(['nombre' => 'Test', 'descripcion' => 'D', 'created_by' => $user->id]);
        $user->roles()->attach($role->id);
        $this->assertTrue($user->roles->contains($role));

        $territorio = Territorio::create(['nombre' => 'Terr T', 'pais_id' => $pais->id, 'tipo' => 'Provincia']);
        $user->territorios()->attach($territorio->id);
        $this->assertTrue($user->territorios->contains($territorio));
    }

    public function test_has_permission()
    {
        $user = User::factory()->create();
        $role = Role::create(['nombre' => 'Test', 'descripcion' => 'D', 'created_by' => $user->id]);
        $user->roles()->attach($role->id);

        $permiso = Permiso::create([
            'nombre' => 'Crear Test',
            'accion' => 'CREATE',
            'recurso' => 'test',
        ]);
        $role->permisos()->attach($permiso->id);

        $this->assertTrue($user->hasPermission('CREATE_TEST'));
        $this->assertTrue($user->hasPermission('create_test'));
        $this->assertFalse($user->hasPermission('READ_TEST'));
    }
}
