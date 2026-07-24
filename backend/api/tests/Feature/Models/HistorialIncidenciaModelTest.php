<?php

namespace Tests\Feature\Models;

use App\Models\CategoriaIncidencia;
use App\Models\EstadoIncidencia;
use App\Models\HistorialIncidencia;
use App\Models\Incidencia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HistorialIncidenciaModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_historial_incidencia_relations()
    {
        $estado = EstadoIncidencia::create([
            'nombre' => 'Abierto',
            'descripcion' => 'Estado inicial',
            'color' => '#FFFFFF',
            'icono' => 'icon',
        ]);
        $usuario = User::factory()->create();

        $categoria = CategoriaIncidencia::create(['nombre' => 'Test Cat', 'activo' => true]);

        $incidencia = Incidencia::create([
            'titulo' => 'Test',
            'descripcion' => 'Test desc',
            'estado_id' => $estado->id,
            'categoria_id' => $categoria->id,
            'creador_id' => $usuario->id,
        ]);

        $historial = HistorialIncidencia::create([
            'incidencia_id' => $incidencia->id,
            'estado_id' => $estado->id,
            'usuario_id' => $usuario->id,
            'comentario' => 'Cambio de estado',
        ]);

        $this->assertInstanceOf(Incidencia::class, $historial->incidencia);
        $this->assertEquals($incidencia->id, $historial->incidencia->id);

        $this->assertInstanceOf(EstadoIncidencia::class, $historial->estado);
        $this->assertEquals($estado->id, $historial->estado->id);

        $this->assertInstanceOf(User::class, $historial->usuario);
        $this->assertEquals($usuario->id, $historial->usuario->id);
    }
}
