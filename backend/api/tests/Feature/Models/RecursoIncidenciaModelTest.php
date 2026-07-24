<?php

namespace Tests\Feature\Models;

use App\Models\Incidencia;
use App\Models\RecursoIncidencia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecursoIncidenciaModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_relationships_and_accessors()
    {
        \Illuminate\Support\Facades\Storage::fake('s3');
        $user = User::factory()->create();
        $estado = \App\Models\EstadoIncidencia::create(['nombre' => 'Test', 'color_hex' => '#fff']);
        $incidencia = Incidencia::create([
            'incidencia_descripcion' => 'Test Desc',
            'estado_id' => $estado->id,
            'cliente_id' => $user->id,
        ]);

        $recurso = RecursoIncidencia::create([
            'incidencia_id' => $incidencia->id,
            'url' => 'http://example.com/image.png',
            'tipo' => 'image',
        ]);

        $this->assertInstanceOf(Incidencia::class, $recurso->incidencia);
        $this->assertEquals($incidencia->id, $recurso->incidencia->id);

        // Test absolute URL accessor
        $this->assertEquals('http://example.com/image.png', $recurso->url);

        // Test relative URL accessor (local storage)
        $recursoLocal = RecursoIncidencia::create([
            'incidencia_id' => $incidencia->id,
            'url' => 'uploads/test.png',
            'tipo' => 'image',
        ]);

        $this->assertStringContainsString('uploads/test.png', $recursoLocal->url);
    }
}
