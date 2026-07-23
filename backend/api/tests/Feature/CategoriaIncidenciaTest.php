<?php

namespace Tests\Feature;

use App\Models\CategoriaIncidencia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoriaIncidenciaTest extends TestCase
{
    const string ENDPOINT_CATEGORIES = '/api/v1/incident-categories';
    const string ASSERT_CATEGORY = 'Nueva Categoria';
    const string ASSERT_NEW_NAME = 'New Name';

    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = $this->createAdminUser();
        Sanctum::actingAs($this->admin);
    }

    public function test_index_returns_paginated_categories()
    {
        CategoriaIncidencia::create(['nombre' => 'Cat1', 'activo' => true]);
        CategoriaIncidencia::create(['nombre' => 'Cat2', 'activo' => true]);

        $response = $this->getJson(self::ENDPOINT_CATEGORIES);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'nombre', 'activo']
                ],
                'current_page',
                'total'
            ]);

        $this->assertGreaterThanOrEqual(2, count($response->json('data')));
    }

    public function test_index_returns_all_categories_when_all_true()
    {
        CategoriaIncidencia::create(['nombre' => 'Cat1', 'activo' => true]);

        $response = $this->getJson(self::ENDPOINT_CATEGORIES . '?all=true');

        $response->assertStatus(200);
        $this->assertIsArray($response->json());
        $this->assertGreaterThanOrEqual(1, count($response->json()));
    }

    public function test_store_creates_new_category()
    {
        $response = $this->postJson(self::ENDPOINT_CATEGORIES, [
            'nombre' => 'Nueva Categoria',
            'descripcion' => 'Desc de prueba',
            'activo' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['nombre' => self::ASSERT_CATEGORY, 'descripcion' => 'Desc de prueba']);

        $this->assertDatabaseHas('categorias_incidencia', [
            'nombre' => self::ASSERT_CATEGORY
        ]);
    }

    public function test_store_validates_required_fields()
    {
        $response = $this->postJson(self::ENDPOINT_CATEGORIES, []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nombre']);
    }

    public function test_show_returns_category()
    {
        $cat = CategoriaIncidencia::create(['nombre' => 'Cat Show']);

        $response = $this->getJson(self::ENDPOINT_CATEGORIES . '/' . $cat->id);

        $response->assertStatus(200)
            ->assertJsonFragment(['nombre' => 'Cat Show']);
    }

    public function test_show_returns_404_if_not_found()
    {
        $response = $this->getJson(self::ENDPOINT_CATEGORIES . '/9999');

        $response->assertStatus(404);
    }

    public function test_update_modifies_existing_category()
    {
        $cat = CategoriaIncidencia::create(['nombre' => 'Old Name']);

        $response = $this->putJson(self::ENDPOINT_CATEGORIES . '/' . $cat->id, [
            'nombre' => 'New Name'
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['nombre' => self::ASSERT_NEW_NAME]);

        $this->assertDatabaseHas('categorias_incidencia', [
            'id' => $cat->id,
            'nombre' => self::ASSERT_NEW_NAME
        ]);
    }

    public function test_update_prevents_circular_dependency()
    {
        $parent = CategoriaIncidencia::create(['nombre' => 'Parent']);
        $child = CategoriaIncidencia::create(['nombre' => 'Child', 'parent_id' => $parent->id]);

        $response = $this->putJson(self::ENDPOINT_CATEGORIES . '/' . $parent->id, [
            'parent_id' => $child->id
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'No se puede asignar una subcategoría como categoría padre.']);
    }

    public function test_destroy_deletes_category()
    {
        $cat = CategoriaIncidencia::create(['nombre' => 'To Delete']);

        $response = $this->deleteJson(self::ENDPOINT_CATEGORIES . '/' . $cat->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('categorias_incidencia', ['id' => $cat->id]);
    }

    public function test_destroy_prevents_deletion_if_has_children()
    {
        $parent = CategoriaIncidencia::create(['nombre' => 'Parent']);
        CategoriaIncidencia::create(['nombre' => 'Child', 'parent_id' => $parent->id]);

        $response = $this->deleteJson(self::ENDPOINT_CATEGORIES . '/' . $parent->id);

        $response->assertStatus(400)
            ->assertJsonFragment(['message' => 'No se puede eliminar la categoría porque tiene subcategorías asociadas.']);

        $this->assertDatabaseHas('categorias_incidencia', ['id' => $parent->id]);
    }
}
