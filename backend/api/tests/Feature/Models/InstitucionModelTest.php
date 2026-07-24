<?php

namespace Tests\Feature\Models;

use App\Models\Institucion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstitucionModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_relationships()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        $institucion = Institucion::create([
            'nombre' => 'Test Inst',
            'siglas' => 'TI',
            'created_by' => $user1->id,
            'updated_by' => $user2->id,
            'deleted_by' => $user3->id,
        ]);

        $this->assertInstanceOf(User::class, $institucion->creador);
        $this->assertEquals($user1->id, $institucion->creador->id);

        $this->assertInstanceOf(User::class, $institucion->actualizador);
        $this->assertEquals($user2->id, $institucion->actualizador->id);

        $this->assertInstanceOf(User::class, $institucion->eliminador);
        $this->assertEquals($user3->id, $institucion->eliminador->id);
    }
}
