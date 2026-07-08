<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Override;
use Tests\TestCase;

class RoleIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    #[Override]
    protected function setUp(): void
    {
        parent::setUp();
        $this->user = $this->createAdminUser([
            'name' => 'Test',
            'username' => 'Test@test.com',
            'email' => 'test@test.com',
            'password' => 'password123',
        ]);
    }

    public function test_se_pueden_listar_roles(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('api/v1/roles');

        $response->assertStatus(200);
    }
}
