<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CursorPaginationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_incidencias_index_uses_cursor_pagination()
    {
        $user = User::where('email', 'test@example.com')->first();
        $this->actingAs($user);

        $response = $this->getJson('/api/v1/incidents');

        $response->assertStatus(200);

        // La paginación por cursor incluye next_cursor, prev_cursor y NO incluye current_page ni total
        $response->assertJsonStructure([
            'data',
            'next_cursor',
            'next_page_url',
            'prev_cursor',
            'prev_page_url',
        ]);

        $response->assertJsonMissing([
            'current_page',
            'last_page',
            'total',
        ]);
    }
}
