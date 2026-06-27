<?php

namespace Tests\Feature;

use App\Models\Direccion;
use App\Models\Pais;
use App\Models\CategoriaIncidencia;
use App\Models\Territorio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Override;
use Tests\TestCase;

class CatalogoTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    #[Override]
    protected function setUp(): void
    {
        parent::setUp();
        $this->user = $this->createAdminUser([
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);
    }

    public function test_no_se_puede_acceder_a_catalogos_sin_autenticacion(): void
    {
        $response = $this->getJson('/api/v1/catalogos/paises');
        $response->assertStatus(401);
    }

    public function test_se_pueden_listar_paises(): void
    {
        Sanctum::actingAs($this->user);

        Pais::create(['nombre' => 'Perú', 'codigo_iso' => 'PE', 'activo' => true]);
        Pais::create(['nombre' => 'México', 'codigo_iso' => 'MX', 'activo' => true]);
        Pais::create(['nombre' => 'Inactivo', 'codigo_iso' => 'XX', 'activo' => false]);

        $response = $this->getJson('/api/v1/catalogos/paises');

        $response->assertStatus(200);
        $response->assertJsonCount(2);
        $response->assertJsonFragment(['nombre' => 'Perú']);
        $response->assertJsonFragment(['nombre' => 'México']);
        $response->assertJsonMissing(['nombre' => 'Inactivo']);
    }

    public function test_se_pueden_listar_territorios_filtrados(): void
    {
        Sanctum::actingAs($this->user);

        $peru = Pais::create(['nombre' => 'Perú', 'codigo_iso' => 'PE']);
        $mexico = Pais::create(['nombre' => 'México', 'codigo_iso' => 'MX']);

        $limaDpto = Territorio::create([
            'pais_id' => $peru->id,
            'parent_id' => null,
            'nombre' => 'Lima',
            'tipo' => 'Departamento',
        ]);

        $limaProv = Territorio::create([
            'pais_id' => $peru->id,
            'parent_id' => $limaDpto->id,
            'nombre' => 'Lima Provincia',
            'tipo' => 'Provincia',
        ]);

        $cdmx = Territorio::create([
            'pais_id' => $mexico->id,
            'parent_id' => null,
            'nombre' => 'Ciudad de México',
            'tipo' => 'Estado',
        ]);

        // 1. Todos los territorios
        $response = $this->getJson('/api/v1/catalogos/territorios');
        $response->assertStatus(200);
        $response->assertJsonCount(3);

        // 2. Filtrado por pais_id
        $response = $this->getJson("/api/v1/catalogos/territorios?pais_id={$peru->id}");
        $response->assertStatus(200);
        $response->assertJsonCount(2);

        // 3. Filtrado por parent_id = null (top-level)
        $response = $this->getJson("/api/v1/catalogos/territorios?pais_id={$peru->id}&parent_id=null");
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['nombre' => 'Lima']);

        // 4. Filtrado por parent_id específico
        $response = $this->getJson("/api/v1/catalogos/territorios?parent_id={$limaDpto->id}");
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['nombre' => 'Lima Provincia']);
    }

    public function test_se_pueden_listar_direcciones_filtradas(): void
    {
        Sanctum::actingAs($this->user);

        $peru = Pais::create(['nombre' => 'Perú', 'codigo_iso' => 'PE']);
        $limaDpto = Territorio::create([
            'pais_id' => $peru->id,
            'parent_id' => null,
            'nombre' => 'Lima',
        ]);

        $dir1 = Direccion::create([
            'territorio_id' => $limaDpto->id,
            'detalle' => 'Av. Javier Prado 123',
        ]);

        $dir2 = Direccion::create([
            'territorio_id' => $limaDpto->id,
            'detalle' => 'Calle Larco 456',
            'activo' => false, // inactivo
        ]);

        $response = $this->getJson("/api/v1/catalogos/direcciones?territorio_id={$limaDpto->id}");
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['detalle' => 'Av. Javier Prado 123']);
        $response->assertJsonMissing(['detalle' => 'Calle Larco 456']);
    }

    public function test_se_pueden_listar_categorias_incidencia_filtradas(): void
    {
        Sanctum::actingAs($this->user);

        // Soporte (Raíz)
        $soporte = CategoriaIncidencia::create([
            'nombre' => 'Soporte Técnico',
            'parent_id' => null,
        ]);

        // Hardware (Nivel medio)
        $hardware = CategoriaIncidencia::create([
            'nombre' => 'Hardware',
            'parent_id' => $soporte->id,
        ]);

        // PC / Laptop (Hoja)
        $pc = CategoriaIncidencia::create([
            'nombre' => 'PC / Laptop',
            'parent_id' => $hardware->id,
        ]);

        // Inactivo (Hijo inactivo)
        $inactivo = CategoriaIncidencia::create([
            'nombre' => 'Equipo Especial',
            'parent_id' => $hardware->id,
            'activo' => false,
        ]);

        // 1. Listar todas las categorías activas (deberían ser 3)
        $response = $this->getJson('/api/v1/catalogos/categorias-incidencia');
        $response->assertStatus(200);
        $response->assertJsonCount(3);

        // 2. Listar únicamente categorías principales (parent_id = null)
        $response = $this->getJson('/api/v1/catalogos/categorias-incidencia?parent_id=null');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['nombre' => 'Soporte Técnico']);

        // 3. Listar subcategorías de Hardware
        $response = $this->getJson("/api/v1/catalogos/categorias-incidencia?parent_id={$hardware->id}");
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['nombre' => 'PC / Laptop']);
        $response->assertJsonMissing(['nombre' => 'Equipo Especial']);

        // 4. Listar únicamente nodos hoja (solo_hojas = true)
        // En este árbol, sólo $pc es un nodo hoja activo ($soporte tiene hijos, $hardware tiene hijos, $inactivo es inactivo)
        $response = $this->getJson('/api/v1/catalogos/categorias-incidencia?solo_hojas=true');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['nombre' => 'PC / Laptop']);
        $response->assertJsonMissing(['nombre' => 'Soporte Técnico']);
        $response->assertJsonMissing(['nombre' => 'Hardware']);
    }
}
