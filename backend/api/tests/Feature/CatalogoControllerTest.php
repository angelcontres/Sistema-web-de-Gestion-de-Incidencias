<?php

namespace Tests\Feature;

use App\Models\CategoriaIncidencia;
use App\Models\Direccion;
use App\Models\EstadoIncidencia;
use App\Models\Institucion;
use App\Models\Pais;
use App\Models\Prioridad;
use App\Models\Territorio;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class CatalogoControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Limpiar cache para evitar interferencias
        Cache::flush();
        
        $user = \App\Models\User::factory()->create();
        \Laravel\Sanctum\Sanctum::actingAs($user);
    }

    /**
     * @group HU-10
     */
    public function test_can_get_paises()
    {
        Pais::create(['nombre' => 'Ecuador', 'activo' => true]);
        Pais::create(['nombre' => 'Colombia', 'activo' => false]);

        $response = $this->getJson('/api/v1/catalogs/countries');

        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonFragment(['nombre' => 'Ecuador']);
    }

    /**
     * @group HU-10
     */
    public function test_can_get_territorios_without_filters()
    {
        $pais = Pais::create(['nombre' => 'Pais T', 'activo' => true]);
        Territorio::create(['nombre' => 'Guayas', 'pais_id' => $pais->id, 'activo' => true]);
        Territorio::create(['nombre' => 'Pichincha', 'pais_id' => $pais->id, 'activo' => true]);
        Territorio::create(['nombre' => 'Manabí', 'pais_id' => $pais->id, 'activo' => false]);

        $response = $this->getJson('/api/v1/catalogs/territories');

        $response->assertStatus(200)
                 ->assertJsonCount(2)
                 ->assertJsonFragment(['nombre' => 'Guayas']);
    }

    /**
     * @group HU-10
     */
    public function test_can_get_territorios_with_filters()
    {
        $pais = Pais::create(['nombre' => 'Pais', 'activo' => true]);
        $parent = Territorio::create(['nombre' => 'T1', 'pais_id' => $pais->id, 'activo' => true]);
        Territorio::create(['pais_id' => $pais->id, 'parent_id' => $parent->id, 'activo' => true, 'nombre' => 'Guayaquil']);
        Territorio::create(['pais_id' => $pais->id, 'parent_id' => null, 'activo' => true, 'nombre' => 'Quito']);

        // Test filter by pais_id
        $response1 = $this->getJson('/api/v1/catalogs/territories?pais_id=' . $pais->id);
        $response1->assertStatus(200)->assertJsonCount(3);

        // Test filter by parent_id
        $response2 = $this->getJson('/api/v1/catalogs/territories?parent_id=' . $parent->id);
        $response2->assertStatus(200)->assertJsonCount(1)->assertJsonFragment(['nombre' => 'Guayaquil']);

        // Test filter by parent_id = null
        $response3 = $this->getJson('/api/v1/catalogs/territories?parent_id=null');
        $response3->assertStatus(200)->assertJsonCount(2);
    }

    /**
     * @group HU-10
     */
    public function test_can_get_direcciones_without_filters()
    {
        $pais = Pais::create(['nombre' => 'Pais D', 'activo' => true]);
        $territorio = Territorio::create(['nombre' => 'Terr D', 'pais_id' => $pais->id, 'activo' => true]);
        Direccion::create(['territorio_id' => $territorio->id, 'activo' => true, 'detalle' => 'Calle 1']);
        Direccion::create(['territorio_id' => $territorio->id, 'activo' => false, 'detalle' => 'Calle 2']);

        $response = $this->getJson('/api/v1/catalogs/addresses');

        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonFragment(['detalle' => 'Calle 1']);
    }

    /**
     * @group HU-10
     */
    public function test_can_get_direcciones_with_filters()
    {
        $pais = Pais::create(['nombre' => 'Pais D', 'activo' => true]);
        $territorio = Territorio::create(['nombre' => 'Terr D', 'pais_id' => $pais->id, 'activo' => true]);
        Direccion::create(['territorio_id' => $territorio->id, 'activo' => true, 'detalle' => 'Dir 1']);
        Direccion::create(['territorio_id' => $territorio->id, 'activo' => true, 'detalle' => 'Dir 2']);

        $response = $this->getJson('/api/v1/catalogs/addresses?territorio_id=' . $territorio->id);

        $response->assertStatus(200)
                 ->assertJsonCount(2)
                 ->assertJsonFragment(['detalle' => 'Dir 1']);
    }

    /**
     * @group HU-10
     */
    public function test_can_get_categorias_incidencia()
    {
        $parent = CategoriaIncidencia::create(['activo' => true, 'nombre' => 'Seguridad']);
        CategoriaIncidencia::create(['activo' => true, 'parent_id' => $parent->id, 'nombre' => 'Robo']);
        CategoriaIncidencia::create(['activo' => false, 'nombre' => 'Test']);

        $response1 = $this->getJson('/api/v1/catalogs/incident-categories');
        $response1->assertStatus(200)->assertJsonCount(2);

        $response2 = $this->getJson('/api/v1/catalogs/incident-categories?parent_id=' . $parent->id);
        $response2->assertStatus(200)->assertJsonCount(1)->assertJsonFragment(['nombre' => 'Robo']);

        $response3 = $this->getJson('/api/v1/catalogs/incident-categories?parent_id=null');
        $response3->assertStatus(200)->assertJsonCount(1)->assertJsonFragment(['nombre' => 'Seguridad']);
    }

    /**
     * @group HU-10
     */
    public function test_can_get_categorias_incidencia_hojas()
    {
        $parent = CategoriaIncidencia::create(['activo' => true, 'nombre' => 'Seguridad']);
        CategoriaIncidencia::create(['activo' => true, 'parent_id' => $parent->id, 'nombre' => 'Robo']);
        
        $response = $this->getJson('/api/v1/catalogs/incident-categories?solo_hojas=true');
        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonFragment(['nombre' => 'Robo']);
    }

    /**
     * @group HU-10
     */
    public function test_can_get_instituciones()
    {
        Institucion::create(['activo' => true, 'nombre' => 'Policia', 'siglas' => 'POL']);
        Institucion::create(['activo' => false, 'nombre' => 'Bomberos', 'siglas' => 'BOM']);

        $response = $this->getJson('/api/v1/catalogs/institutions');

        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonFragment(['nombre' => 'Policia']);
    }

    /**
     * @group HU-10
     */
    public function test_can_get_estados_incidencia()
    {
        EstadoIncidencia::create(['nombre' => 'Abierto']);
        EstadoIncidencia::create(['nombre' => 'Cerrado']);

        $response = $this->getJson('/api/v1/catalogs/incident-states');

        $response->assertStatus(200)
                 ->assertJsonCount(2)
                 ->assertJsonFragment(['nombre' => 'Abierto']);
    }

    /**
     * @group HU-10
     */
    public function test_can_get_prioridades()
    {
        Prioridad::create(['nombre' => 'Alta', 'color_hex' => '#FF0000']);
        Prioridad::create(['nombre' => 'Baja', 'color_hex' => '#00FF00']);

        $response = $this->getJson('/api/v1/catalogs/priorities');

        $response->assertStatus(200)
                 ->assertJsonCount(2)
                 ->assertJsonFragment(['nombre' => 'Alta']);
    }
}
