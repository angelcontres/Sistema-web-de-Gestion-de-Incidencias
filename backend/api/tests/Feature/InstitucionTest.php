<?php

namespace Tests\Feature;

use App\Models\Institucion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InstitucionTest extends TestCase
{
    const string ENDPOINT_INSTITUTIONS = '/api/v1/institutions';

    const string ASSERT_INSTITUTION_NAME = 'Cruz Roja';

    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = $this->createAdminUser();
        Sanctum::actingAs($this->admin);
    }

    public function test_index_returns_instituciones()
    {
        Institucion::create(['nombre' => 'Inst1', 'siglas' => 'I1']);

        $response = $this->getJson(self::ENDPOINT_INSTITUTIONS);
        $response->assertStatus(200);
        $this->assertArrayHasKey('data', $response->json());
    }

    public function test_index_with_search()
    {
        Institucion::create(['nombre' => 'Bomberos Test', 'siglas' => 'BOM']);
        Institucion::create(['nombre' => 'Policia Test', 'siglas' => 'POL']);

        $response = $this->getJson(self::ENDPOINT_INSTITUTIONS.'?search=Bomberos');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Bomberos Test', $response->json('data.0.nombre'));
    }

    public function test_index_returns_all_without_pagination()
    {
        Institucion::create(['nombre' => 'Inst1', 'siglas' => 'I1']);
        $response = $this->getJson(self::ENDPOINT_INSTITUTIONS.'?all=true');
        $response->assertStatus(200);
        $this->assertIsArray($response->json());
    }

    public function test_store_creates_institucion()
    {
        $response = $this->postJson(self::ENDPOINT_INSTITUTIONS, [
            'nombre' => 'Cruz Roja',
            'siglas' => 'CR',
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['nombre' => self::ASSERT_INSTITUTION_NAME]);

        $this->assertDatabaseHas('instituciones', ['nombre' => self::ASSERT_INSTITUTION_NAME]);
    }

    public function test_store_validates_required_fields()
    {
        $response = $this->postJson(self::ENDPOINT_INSTITUTIONS, []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nombre', 'siglas']);
    }

    public function test_show_returns_institucion()
    {
        $inst = Institucion::create(['nombre' => 'Inst Show', 'siglas' => 'ISH']);
        $response = $this->getJson(self::ENDPOINT_INSTITUTIONS.'/'.$inst->id);
        $response->assertStatus(200)->assertJsonFragment(['nombre' => 'Inst Show']);
    }

    public function test_update_modifies_institucion()
    {
        $inst = Institucion::create(['nombre' => 'Old', 'siglas' => 'O']);
        $response = $this->putJson(self::ENDPOINT_INSTITUTIONS.'/'.$inst->id, [
            'nombre' => 'New',
            'siglas' => 'N',
        ]);
        $response->assertStatus(200)->assertJsonFragment(['nombre' => 'New']);
        $this->assertDatabaseHas('instituciones', ['id' => $inst->id, 'nombre' => 'New']);
    }

    public function test_destroy_deletes_institucion()
    {
        $inst = Institucion::create(['nombre' => 'Del', 'siglas' => 'D']);
        $response = $this->deleteJson(self::ENDPOINT_INSTITUTIONS.'/'.$inst->id);
        $response->assertStatus(200);
        $this->assertDatabaseMissing('instituciones', ['id' => $inst->id, 'deleted_at' => null]);
    }
}
