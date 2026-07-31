<?php

namespace Tests\Feature\Models;

use App\Models\OpcionMenu;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpcionMenuModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_relationships()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        $padre = OpcionMenu::create([
            'nombre' => 'Padre',
            'ruta' => '/padre',
            'created_by' => $user1->id,
            'updated_by' => $user2->id,
            'deleted_by' => $user3->id,
        ]);

        $hijo = OpcionMenu::create([
            'nombre' => 'Hijo',
            'ruta' => '/hijo',
            'padre_id' => $padre->id,
            'created_by' => $user1->id,
        ]);

        // BelongsTo (padre)
        $this->assertInstanceOf(OpcionMenu::class, $hijo->padre);
        $this->assertEquals($padre->id, $hijo->padre->id);

        // HasMany (hijos)
        $this->assertCount(1, $padre->hijos);
        $this->assertEquals($hijo->id, $padre->hijos->first()->id);

        // Creator, Updater, Deleter
        $this->assertInstanceOf(User::class, $padre->creator);
        $this->assertEquals($user1->id, $padre->creator->id);

        $this->assertInstanceOf(User::class, $padre->updater);
        $this->assertEquals($user2->id, $padre->updater->id);

        $this->assertInstanceOf(User::class, $padre->deleter);
        $this->assertEquals($user3->id, $padre->deleter->id);
    }
    
    public function test_booted_requires_created_by_if_unauthenticated()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('created_by es requerido cuando no hay usuario autenticado.');

        OpcionMenu::create([
            'nombre' => 'Fail',
        ]);
    }
}
