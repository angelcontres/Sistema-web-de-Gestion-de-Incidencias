<?php

namespace Tests\Feature\Services;

use App\Models\CategoriaIncidencia;
use App\Models\EstadoIncidencia;
use App\Models\Incidencia;
use App\Models\Prioridad;
use App\Models\User;
use App\Services\IncidenciaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class IncidenciaServiceTest extends TestCase
{
    use RefreshDatabase;

    protected IncidenciaService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(IncidenciaService::class);
        putenv('FILESYSTEM_DISK=public');
    }

    public function test_calculate_priority_returns_null_if_no_base_priority()
    {
        $subtipo = CategoriaIncidencia::create(['nombre' => 'Test Sin Prioridad']);

        $priority = $this->service->calculatePriority($subtipo->id, 1);

        $this->assertNull($priority);
    }

    public function test_calculate_priority_escalates_priority_when_high_affected()
    {
        Prioridad::create(['id' => 1, 'nombre' => 'P1', 'color_hex' => '#000']);
        Prioridad::create(['id' => 2, 'nombre' => 'P2', 'color_hex' => '#000']);
        Prioridad::create(['id' => 3, 'nombre' => 'P3', 'color_hex' => '#000']);
        Prioridad::create(['id' => 4, 'nombre' => 'P4', 'color_hex' => '#000']);
        Prioridad::create(['id' => 5, 'nombre' => 'P5', 'color_hex' => '#000']);

        $subtipoAlta = CategoriaIncidencia::create(['nombre' => 'Test', 'prioridad_id' => 2]);
        $this->assertEquals(1, $this->service->calculatePriority($subtipoAlta->id, 15));

        $subtipoMedia = CategoriaIncidencia::create(['nombre' => 'Test', 'prioridad_id' => 3]);
        $this->assertEquals(2, $this->service->calculatePriority($subtipoMedia->id, 15));

        $subtipoBaja = CategoriaIncidencia::create(['nombre' => 'Test', 'prioridad_id' => 4]);
        $this->assertEquals(3, $this->service->calculatePriority($subtipoBaja->id, 15));

        $subtipoOther = CategoriaIncidencia::create(['nombre' => 'Test', 'prioridad_id' => 5]);
        $this->assertEquals(5, $this->service->calculatePriority($subtipoOther->id, 15));
    }

    public function test_process_base64_resources()
    {
        Storage::fake('public');

        $estado = EstadoIncidencia::create(['nombre' => 'Abierto', 'color' => '#fff', 'icono' => 'icon']);
        $subtipo = CategoriaIncidencia::create(['nombre' => 'Test Subtipo']);

        $incidencia = Incidencia::create([
            'titulo' => 'Test',
            'descripcion' => 'Test desc',
            'estado_id' => $estado->id,
            'categoria_id' => $subtipo->id,
        ]);

        $recursos = [
            // Valid base64 image (a 1x1 transparent png)
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            // Invalid base64
            'invalid_base_64_string',
            // Missing data prefix
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        ];

        $this->service->processBase64Resources($incidencia, $recursos);

        // It should have created exactly 2 resources (the valid one with data prefix, and the one without)
        $this->assertEquals(2, $incidencia->recursos()->count());
    }

    public function test_create_and_update_incidencia()
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->actingAs($user);

        Prioridad::create(['id' => 3, 'nombre' => 'P3', 'color_hex' => '#000']);
        $estado = EstadoIncidencia::create(['nombre' => 'Abierto', 'color' => '#fff', 'icono' => 'icon']);
        $subtipo = CategoriaIncidencia::create(['nombre' => 'Test Subtipo', 'prioridad_id' => 3]);

        $data = [
            'incidencia_descripcion' => 'Test creation',
            'estado_id' => $estado->id,
            'tipo_incidencia_id' => $subtipo->id,
            'sub_tipo_incidencia_id' => $subtipo->id,
            'cantidad_afectados_incidencia' => 5,
        ];

        $result = $this->service->createIncidencia($data, $user);

        $this->assertArrayHasKey('data', $result);
        $incidencia = $result['data'];

        $this->assertEquals('Test creation', $incidencia->incidencia_descripcion);
        $this->assertEquals(1, $incidencia->version);

        // Now test update
        $updateData = [
            'incidencia_descripcion' => 'Updated description',
        ];

        $updateResult = $this->service->updateIncidencia($incidencia, $updateData, $user);

        $updatedIncidencia = $updateResult['data'];
        $this->assertEquals('Updated description', $updatedIncidencia->incidencia_descripcion);
        $this->assertEquals(2, $updatedIncidencia->version);
    }
}
