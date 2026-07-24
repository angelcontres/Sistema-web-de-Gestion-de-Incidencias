<?php

namespace Tests\Feature;

use App\Models\Direccion;
use App\Models\Pais;
use App\Models\Permiso;
use App\Models\Role;
use App\Models\Territorio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DireccionTest extends TestCase
{
    const ENDPOINT_ADDRESSES = '/api/v1/addresses';

    const CALLE_MAGNOLIAS_NAME = 'Calle Las Magnolias 123';

    const CALLE_VERDADERA_NAME = 'Calle Verdadera 456';

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

        $response = $this->actingAs($this->user)->putJson(self::ENDPOINT_ADDRESSES."/{$direccion->id}", $payload);

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

        $response = $this->actingAs($this->user)->deleteJson(self::ENDPOINT_ADDRESSES."/{$direccion->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('direcciones', [
            'id' => $direccion->id,
        ]);
    }

    public function test_reverse_geocode_validation()
    {
        $response = $this->actingAs($this->user)->getJson('/api/v1/geocoding/reverse');
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['lat', 'lng']);
    }

    public function test_reverse_geocode_nominatim_success()
    {
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response([
                'address' => [
                    'postcode' => '12345',
                ],
            ], 200),
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/v1/geocoding/reverse?lat=-12.0&lng=-77.0');
        $response->assertStatus(200)
            ->assertJsonFragment(['postcode' => '12345']);
    }

    public function test_reverse_geocode_fallback_to_bigdatacloud()
    {
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response([], 500),
            'api.bigdatacloud.net/*' => Http::response([
                'postcode' => '67890',
            ], 200),
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/v1/geocoding/reverse?lat=-12.0&lng=-77.0');
        $response->assertStatus(200)
            ->assertJsonFragment(['postcode' => '67890']);
    }

    public function test_non_admin_user_restricted_by_pais()
    {
        $nonAdminUser = User::factory()->create(['pais_id' => $this->pais->id]);
        $role = Role::create(['nombre' => 'User', 'descripcion' => 'U', 'created_by' => $nonAdminUser->id]);
        $otherPais = Pais::create(['nombre' => 'Otro', 'codigo_iso' => 'OT']);
        $otherTerritorio = Territorio::create(['pais_id' => $otherPais->id, 'nombre' => 'T2', 'tipo' => 'Departamento']);
        $permiso = Permiso::create([
            'nombre' => 'Ver Direcciones',
            'accion' => 'READ',
            'recurso' => 'direcciones',
        ]);
        $role->permisos()->attach($permiso->id);
        $nonAdminUser->roles()->attach($role->id);

        $direccion = Direccion::create([
            'territorio_id' => $otherTerritorio->id,
            'detalle' => 'Detalle',
        ]);

        // Listar filtrado
        $response = $this->actingAs($nonAdminUser)->getJson(self::ENDPOINT_ADDRESSES);
        $response->assertStatus(200);
        $this->assertEmpty($response->json('data'));

        // Mostrar no autorizado
        $response = $this->actingAs($nonAdminUser)->getJson(self::ENDPOINT_ADDRESSES.'/'.$direccion->id);
        $response->assertStatus(403);
    }
}
