<?php

namespace Tests\Feature;

use App\Models\Pais;
use App\Models\Territorio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TerritorioTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/v1/territories';
    private const TABLE = 'territorios';
    private const ATTR_NOMBRE = 'nombre';
    private const ATTR_TIPO = 'tipo';
    private const ATTR_PAIS_ID = 'pais_id';

    private User $admin;
    private Pais $pais;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = $this->createAdminUser();
        Sanctum::actingAs($this->admin);
        $this->pais = Pais::create([self::ATTR_NOMBRE => 'Pais T', 'codigo_iso' => 'PT']);
    }

    public function test_index_returns_territorios()
    {
        Territorio::create([self::ATTR_NOMBRE => 'T1', self::ATTR_TIPO => 'Estado', self::ATTR_PAIS_ID => $this->pais->id]);
        $response = $this->getJson(self::ENDPOINT);
        $response->assertStatus(200);
        $this->assertArrayHasKey('data', $response->json());
    }

    public function test_store_creates_territorio()
    {
        $response = $this->postJson(self::ENDPOINT, [
            self::ATTR_NOMBRE => 'New T',
            self::ATTR_TIPO => 'Provincia',
            self::ATTR_PAIS_ID => $this->pais->id
        ]);
        $response->assertStatus(201)->assertJsonFragment([self::ATTR_NOMBRE => 'New T']);
        $this->assertDatabaseHas(self::TABLE, [self::ATTR_NOMBRE => 'New T']);
    }

    public function test_show_returns_territorio()
    {
        $terr = Territorio::create([self::ATTR_NOMBRE => 'Show T', self::ATTR_TIPO => 'Municipio', self::ATTR_PAIS_ID => $this->pais->id]);
        $response = $this->getJson(self::ENDPOINT . '/' . $terr->id);
        $response->assertStatus(200)->assertJsonFragment([self::ATTR_NOMBRE => 'Show T']);
    }

    public function test_update_modifies_territorio()
    {
        $terr = Territorio::create([self::ATTR_NOMBRE => 'Old', self::ATTR_TIPO => 'Municipio', self::ATTR_PAIS_ID => $this->pais->id]);
        $response = $this->putJson(self::ENDPOINT . '/' . $terr->id, [
            self::ATTR_NOMBRE => 'New'
        ]);
        $response->assertStatus(200)->assertJsonFragment([self::ATTR_NOMBRE => 'New']);
        $this->assertDatabaseHas(self::TABLE, ['id' => $terr->id, self::ATTR_NOMBRE => 'New']);
    }

    public function test_destroy_deletes_territorio()
    {
        $terr = Territorio::create([self::ATTR_NOMBRE => 'Del', self::ATTR_TIPO => 'Municipio', self::ATTR_PAIS_ID => $this->pais->id]);
        $response = $this->deleteJson(self::ENDPOINT . '/' . $terr->id);
        $response->assertStatus(200);
        $this->assertDatabaseMissing(self::TABLE, ['id' => $terr->id]);
    }

    public function test_destroy_prevents_if_has_children()
    {
        $parent = Territorio::create([self::ATTR_NOMBRE => 'Parent', self::ATTR_TIPO => 'Estado', self::ATTR_PAIS_ID => $this->pais->id]);
        Territorio::create([self::ATTR_NOMBRE => 'Child', self::ATTR_TIPO => 'Municipio', self::ATTR_PAIS_ID => $this->pais->id, 'parent_id' => $parent->id]);
        $response = $this->deleteJson(self::ENDPOINT . '/' . $parent->id);
        $response->assertStatus(400);
    }
}
