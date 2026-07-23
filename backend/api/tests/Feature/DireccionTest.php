<?php

namespace Tests\Feature;

use App\Models\Direccion;
use App\Models\Pais;
use App\Models\Territorio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DireccionTest extends TestCase
{
    const string ENDPOINT_ADDRESSES = '/api/v1/addresses';

    const string CALLE_MAGNOLIAS_NAME = 'Calle Las Magnolias 123';
    const string CALLE_VERDADERA_NAME = 'Calle Verdadera 456';

    use RefreshDatabase;

    private User $user;

    private Pais $pais;

    private Territorio $territorio;

    protected function setUp(): void
    {
        parent::setUp();
        // Create an admin user to bypass permission checks
        $this->user = $this->createAdminUser();

        // Create initial seed data for addresses
        $this->pais = Pais::create([
            'nombre' => 'Perú',
            'codigo_iso' => 'PE',
            'activo' => true,
        ]);

        $this->territorio = Territorio::create([
            'pais_id' => $this->pais->id,
            'nombre' => 'Lima',
            'tipo' => 'Departamento',
        ]);
    }

    public function test_can_list_direcciones()
    {
        Direccion::create([
            'territorio_id' => $this->territorio->id,
            'detalle' => 'Av. Arequipa 1111',
            'activo' => true,
        ]);

        $response = $this->actingAs($this->user)->getJson(self::ENDPOINT_ADDRESSES);

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'detalle' => 'Av. Arequipa 1111',
            ]);
    }

    public function test_can_create_direccion()
    {
        $payload = [
            'territorio_id' => $this->territorio->id,
            'detalle' => self::CALLE_MAGNOLIAS_NAME,
            'referencia' => 'Frente al parque',
            'codigo_postal' => '15046',
            'latitud' => -12.046374,
            'longitud' => -77.031250,
            'activo' => true,
        ];

        $response = $this->actingAs($this->user)->postJson(self::ENDPOINT_ADDRESSES, $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.detalle', self::CALLE_MAGNOLIAS_NAME);

        $this->assertDatabaseHas('direcciones', [
            'detalle' => self::CALLE_MAGNOLIAS_NAME,
            'codigo_postal' => '15046',
        ]);
    }

    public function test_cannot_create_direccion_with_invalid_data()
    {
        $payload = [
            'territorio_id' => 9999, // non-existent
            'detalle' => '', // required
            'latitud' => 100, // between -90 and 90
        ];

        $response = $this->actingAs($this->user)->postJson(self::ENDPOINT_ADDRESSES, $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['territorio_id', 'detalle', 'latitud']);
    }

    public function test_can_update_direccion()
    {
        $direccion = Direccion::create([
            'territorio_id' => $this->territorio->id,
            'detalle' => 'Calle Falsa 123',
            'activo' => true,
        ]);

        $payload = [
            'detalle' => self::CALLE_VERDADERA_NAME,
        ];

        $response = $this->actingAs($this->user)->putJson(self::ENDPOINT_ADDRESSES . "/{$direccion->id}", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('data.detalle', self::CALLE_VERDADERA_NAME);

        $this->assertDatabaseHas('direcciones', [
            'id' => $direccion->id,
            'detalle' => self::CALLE_VERDADERA_NAME,
        ]);
    }

    public function test_can_delete_direccion()
    {
        $direccion = Direccion::create([
            'territorio_id' => $this->territorio->id,
            'detalle' => 'Para Eliminar 123',
            'activo' => true,
        ]);

        $response = $this->actingAs($this->user)->deleteJson(self::ENDPOINT_ADDRESSES . "/{$direccion->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('direcciones', [
            'id' => $direccion->id,
        ]);
    }
}
