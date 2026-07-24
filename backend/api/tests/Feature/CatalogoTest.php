<?php

namespace Tests\Feature;

use App\Models\CategoriaIncidencia;
use App\Models\Direccion;
use App\Models\Pais;
use App\Models\Territorio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Override;
use Tests\TestCase;

class CatalogoTest extends TestCase
{
    const string MEXICO_NAME = 'México';

    const string PERU_NAME = 'Perú';

    const string LIMA_NAME = 'Lima';

    const string LIMA_PROV_NAME = 'Lima Provincia';

    const string CDMX_NAME = 'Ciudad de México';

    const string SOPORTE_TECNICO_NAME = 'Soporte Técnico';

    const string HARDWARE_NAME = 'Hardware';

    const string PC_LAPTOP_NAME = 'PC / Laptop';

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
        $response = $this->getJson('/api/v1/catalogs/countries');
        $response->assertStatus(401);
    }

    public function test_se_pueden_listar_paises(): void
    {
        Sanctum::actingAs($this->user);

        Pais::create(['nombre' => 'Perú', 'codigo_iso' => 'PE', 'activo' => true]);
        Pais::create(['nombre' => 'México', 'codigo_iso' => 'MX', 'activo' => true]);
        Pais::create(['nombre' => 'Inactivo', 'codigo_iso' => 'XX', 'activo' => false]);

        $response = $this->getJson('/api/v1/catalogs/countries');

        $response->assertStatus(200);
        $response->assertJsonCount(2);
        $response->assertJsonFragment(['nombre' => self::PERU_NAME]);
        $response->assertJsonFragment(['nombre' => self::MEXICO_NAME]);
        $response->assertJsonMissing(['nombre' => 'Inactivo']);
    }

    public function test_se_pueden_listar_territorios_filtrados(): void
    {
        Sanctum::actingAs($this->user);

        $peru = Pais::create(['nombre' => self::PERU_NAME, 'codigo_iso' => 'PE']);
        $mexico = Pais::create(['nombre' => self::MEXICO_NAME, 'codigo_iso' => 'MX']);

        $limaDpto = Territorio::create([
            'pais_id' => $peru->id,
            'parent_id' => null,
            'nombre' => self::LIMA_NAME,
            'tipo' => 'Departamento',
        ]);

        Territorio::create([
            'pais_id' => $peru->id,
            'parent_id' => $limaDpto->id,
            'nombre' => self::LIMA_PROV_NAME,
            'tipo' => 'Provincia',
        ]);

        Territorio::create([
            'pais_id' => $mexico->id,
            'parent_id' => null,
            'nombre' => self::CDMX_NAME,
            'tipo' => 'Estado',
        ]);

        // 1. Todos los territorios
        $response = $this->getJson('/api/v1/catalogs/territories');
        $response->assertStatus(200);
        $response->assertJsonCount(3);

        // 2. Filtrado por pais_id
        $response = $this->getJson("/api/v1/catalogs/territories?pais_id={$peru->id}");
        $response->assertStatus(200);
        $response->assertJsonCount(2);

        // 3. Filtrado por parent_id = null (top-level)
        $response = $this->getJson("/api/v1/catalogs/territories?pais_id={$peru->id}&parent_id=null");
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['nombre' => self::LIMA_NAME]);

        // 4. Filtrado por parent_id específico
        $response = $this->getJson("/api/v1/catalogs/territories?parent_id={$limaDpto->id}");
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['nombre' => self::LIMA_PROV_NAME]);
    }

    public function test_se_pueden_listar_direcciones_filtradas(): void
    {
        Sanctum::actingAs($this->user);

        $peru = Pais::create(['nombre' => self::PERU_NAME, 'codigo_iso' => 'PE']);
        $limaDpto = Territorio::create([
            'pais_id' => $peru->id,
            'parent_id' => null,
            'nombre' => self::LIMA_NAME,
        ]);

        Direccion::create([
            'territorio_id' => $limaDpto->id,
            'detalle' => 'Av. Javier Prado 123',
        ]);

        Direccion::create([
            'territorio_id' => $limaDpto->id,
            'detalle' => 'Calle Larco 456',
            'activo' => false, // inactivo
        ]);

        $response = $this->getJson("/api/v1/catalogs/addresses?territorio_id={$limaDpto->id}");
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
            'nombre' => self::SOPORTE_TECNICO_NAME,
            'parent_id' => null,
        ]);

        // Hardware (Nivel medio)
        $hardware = CategoriaIncidencia::create([
            'nombre' => self::HARDWARE_NAME,
            'parent_id' => $soporte->id,
        ]);

        // PC / Laptop (Hoja)
        CategoriaIncidencia::create([
            'nombre' => self::PC_LAPTOP_NAME,
            'parent_id' => $hardware->id,
        ]);

        // Inactivo (Hijo inactivo)
        CategoriaIncidencia::create([
            'nombre' => 'Equipo Especial',
            'parent_id' => $hardware->id,
            'activo' => false,
        ]);

        // 1. Listar todas las categorías activas (deberían ser 3)
        $response = $this->getJson('/api/v1/catalogs/incident-categories');
        $response->assertStatus(200);
        $response->assertJsonCount(3);

        // 2. Listar únicamente categorías principales (parent_id = null)
        $response = $this->getJson('/api/v1/catalogs/incident-categories?parent_id=null');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['nombre' => self::SOPORTE_TECNICO_NAME]);

        // 3. Listar subcategorías de Hardware
        $response = $this->getJson("/api/v1/catalogs/incident-categories?parent_id={$hardware->id}");
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['nombre' => self::PC_LAPTOP_NAME]);
        $response->assertJsonMissing(['nombre' => 'Equipo Especial']);

        // 4. Listar únicamente nodos hoja (solo_hojas = true)
        // En este árbol, sólo $pc es un nodo hoja activo ($soporte tiene hijos, $hardware tiene hijos, $inactivo es inactivo)
        $response = $this->getJson('/api/v1/catalogs/incident-categories?solo_hojas=true');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['nombre' => self::PC_LAPTOP_NAME]);
        $response->assertJsonMissing(['nombre' => self::SOPORTE_TECNICO_NAME]);
        $response->assertJsonMissing(['nombre' => self::HARDWARE_NAME]);
    }
}
