<?php

namespace Tests\Feature\Models;

use App\Models\Prioridad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PrioridadModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_relationships()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        $prioridad = Prioridad::create([
            'nombre' => 'Alta',
            'color_hex' => '#FF0000',
            'created_by' => $user1->id,
            'updated_by' => $user2->id,
            'deleted_by' => $user3->id,
        ]);

        $this->assertInstanceOf(User::class, $prioridad->creador);
        $this->assertEquals($user1->id, $prioridad->creador->id);

        $this->assertInstanceOf(User::class, $prioridad->actualizador);
        $this->assertEquals($user2->id, $prioridad->actualizador->id);

        $this->assertInstanceOf(User::class, $prioridad->eliminador);
        $this->assertEquals($user3->id, $prioridad->eliminador->id);
    }
}
