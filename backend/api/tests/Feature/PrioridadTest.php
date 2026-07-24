<?php

namespace Tests\Feature;

use App\Models\Prioridad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PrioridadTest extends TestCase
{
    const string ENDPOINT_PRIORITIES = '/api/v1/priorities';

    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = $this->createAdminUser();
        Sanctum::actingAs($this->admin);
    }

    public function test_index_returns_prioridades()
    {
        Prioridad::create(['nombre' => 'Alta', 'color_hex' => '#FF0000']);
        $response = $this->getJson('/api/v1/priorities');
        $response->assertStatus(200);
        $this->assertIsArray($response->json());
    }

    public function test_store_creates_prioridad()
    {
        $response = $this->postJson(self::ENDPOINT_PRIORITIES, [
            'nombre' => 'Urgente',
            'color_hex' => '#000000',
        ]);
        $response->assertStatus(201)->assertJsonFragment(['nombre' => 'Urgente']);
        $this->assertDatabaseHas('prioridades', ['nombre' => 'Urgente']);
    }

    public function test_store_validates_required_fields()
    {
        $response = $this->postJson(self::ENDPOINT_PRIORITIES, []);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nombre', 'color_hex']);
    }

    public function test_show_returns_prioridad()
    {
        $pri = Prioridad::create(['nombre' => 'Media', 'color_hex' => '#00FF00']);
        $response = $this->getJson(self::ENDPOINT_PRIORITIES.'/'.$pri->id);
        $response->assertStatus(200)->assertJsonFragment(['nombre' => 'Media']);
    }

    public function test_update_modifies_prioridad()
    {
        $pri = Prioridad::create(['nombre' => 'Old', 'color_hex' => '#FFF']);
        $response = $this->putJson(self::ENDPOINT_PRIORITIES.'/'.$pri->id, [
            'nombre' => 'New',
            'color_hex' => '#000',
        ]);
        $response->assertStatus(200)->assertJsonFragment(['nombre' => 'New']);
        $this->assertDatabaseHas('prioridades', ['id' => $pri->id, 'nombre' => 'New']);
    }

    public function test_destroy_deletes_prioridad()
    {
        $pri = Prioridad::create(['nombre' => 'Del', 'color_hex' => '#FFF']);
        $response = $this->deleteJson(self::ENDPOINT_PRIORITIES.'/'.$pri->id);
        $response->assertStatus(200);
        $this->assertDatabaseMissing('prioridades', ['id' => $pri->id, 'deleted_at' => null]);
    }
}
