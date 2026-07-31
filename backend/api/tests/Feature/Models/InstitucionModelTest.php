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

        $estado = \App\Models\EstadoIncidencia::create(['nombre' => 'Test']);
        $prioridad = \App\Models\Prioridad::create(['nombre' => 'Test', 'color_hex' => '#000']);
        $categoria = \App\Models\CategoriaIncidencia::create(['nombre' => 'Test']);
        $pais = \App\Models\Pais::create(['nombre' => 'Test']);
        $territorio = \App\Models\Territorio::create(['nombre' => 'Test', 'pais_id' => $pais->id]);
        $direccion = \App\Models\Direccion::create(['detalle' => 'Test', 'territorio_id' => $territorio->id]);

        $incidencia = \App\Models\Incidencia::create([
            'incidencia_descripcion' => 'Test',
            'direccion_id' => $direccion->id,
            'cliente_id' => $user1->id,
            'estado_id' => $estado->id,
            'tipo_incidencia_id' => $categoria->id,
            'prioridad_id' => $prioridad->id,
            'version' => 1
        ]);
        
        $institucion->incidenciasApoyo()->attach($incidencia->id);

        $this->assertCount(1, $institucion->incidenciasApoyo);
        $this->assertEquals($incidencia->id, $institucion->incidenciasApoyo->first()->id);
    }
}
