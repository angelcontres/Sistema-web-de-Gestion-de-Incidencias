<?php

namespace Tests\Feature;

use App\Models\Pais;
use App\Models\Permiso;
use \App\Models\Role;
use App\Models\Territorio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaisTest extends TestCase
{
    const string ENDPOINT_COUNTRIES = '/api/v1/countries';
    const string ASSERT_NEW_COUNTRY = 'Nuevo Pais';

    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = $this->createAdminUser();
        Sanctum::actingAs($this->admin);
    }

    public function test_index_returns_paises()
    {
        Pais::create(['nombre' => 'Pais1', 'codigo_iso' => 'P1']);
        $response = $this->getJson(self::ENDPOINT_COUNTRIES);
        $response->assertStatus(200);
        $this->assertIsArray($response->json());
        $this->assertNotEmpty($response->json());
    }

    public function test_store_creates_pais()
    {
        $response = $this->postJson(self::ENDPOINT_COUNTRIES, [
            'nombre' => 'Nuevo Pais',
            'codigo_iso' => 'NP',
            'activo' => true
        ]);
        $response->assertStatus(201)->assertJsonFragment(['nombre' => self::ASSERT_NEW_COUNTRY]);
        $this->assertDatabaseHas('paises', ['nombre' => self::ASSERT_NEW_COUNTRY]);
    }

    public function test_store_validates_required_fields()
    {
        $response = $this->postJson(self::ENDPOINT_COUNTRIES, []);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nombre', 'codigo_iso']);
    }

    public function test_show_returns_pais()
    {
        $pais = Pais::create(['nombre' => 'Pais Show', 'codigo_iso' => 'PS']);
        $response = $this->getJson(self::ENDPOINT_COUNTRIES . '/' . $pais->id);
        $response->assertStatus(200)->assertJsonFragment(['nombre' => 'Pais Show']);
    }

    public function test_update_modifies_pais()
    {
        $pais = Pais::create(['nombre' => 'Old', 'codigo_iso' => 'OL']);
        $response = $this->putJson(self::ENDPOINT_COUNTRIES . '/' . $pais->id, [
            'nombre' => 'New'
        ]);
        $response->assertStatus(200)->assertJsonFragment(['nombre' => 'New']);
        $this->assertDatabaseHas('paises', ['id' => $pais->id, 'nombre' => 'New']);
    }

    public function test_destroy_deletes_pais()
    {
        $pais = Pais::create(['nombre' => 'Del', 'codigo_iso' => 'DE']);
        $response = $this->deleteJson(self::ENDPOINT_COUNTRIES . '/' . $pais->id);
        $response->assertStatus(200);
        $this->assertDatabaseMissing('paises', ['id' => $pais->id]);
    }

    public function test_destroy_prevents_deletion_if_has_territorios()
    {
        $pais = Pais::create(['nombre' => 'Parent', 'codigo_iso' => 'PA']);
        Territorio::create(['nombre' => 'Terr', 'pais_id' => $pais->id, 'tipo' => 'Provincia']);

        $response = $this->deleteJson(self::ENDPOINT_COUNTRIES . '/' . $pais->id);
        $response->assertStatus(400)->assertJsonFragment(['message' => 'No se puede eliminar el país porque tiene territorios asociados.']);
        $this->assertDatabaseHas('paises', ['id' => $pais->id]);
    }

    public function test_index_filters_for_non_admin_users()
    {
        $pais = Pais::create(['nombre' => 'Mi Pais', 'codigo_iso' => 'MI']);
        Pais::create(['nombre' => 'Otro Pais', 'codigo_iso' => 'OT']);

        $user = User::factory()->create(['pais_id' => $pais->id]);
        $role = Role::create(['nombre' => 'User Role', 'descripcion' => 'Role de usuario para pruebas', 'created_by' => $user->id]);
        $permiso = Permiso::create(['nombre' => 'Ver', 'accion' => 'READ', 'recurso' => 'paises']);
        $role->permisos()->attach($permiso->id);
        $user->roles()->attach($role->id);

        Sanctum::actingAs($user);

        $response = $this->getJson(self::ENDPOINT_COUNTRIES);
        $response->assertStatus(200);
        $this->assertCount(1, $response->json());
        $this->assertEquals('Mi Pais', $response->json('0.nombre'));
    }

    public function test_show_forbids_non_admin_users_from_other_countries()
    {
        $pais = Pais::create(['nombre' => 'Colombia', 'codigo_iso' => 'CO']);
        $otroPais = Pais::create(['nombre' => 'Venezuela', 'codigo_iso' => 'VE']);

        $user = User::factory()->create(['pais_id' => $pais->id]);
        Sanctum::actingAs($user);

        $response = $this->getJson(self::ENDPOINT_COUNTRIES . '/' . $otroPais->id);
        $response->assertStatus(403);
    }
}
