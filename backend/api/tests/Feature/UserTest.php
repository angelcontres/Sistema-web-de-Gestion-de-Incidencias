<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/v1/users';

    private const TABLE = 'users';

    private const ATTR_NAME = 'name';

    private const ATTR_EMAIL = 'email';

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = $this->createAdminUser();
        Sanctum::actingAs($this->admin);
    }

    public function test_index_returns_users()
    {
        $response = $this->getJson(self::ENDPOINT);
        $response->assertStatus(200);
        $this->assertArrayHasKey('data', $response->json());
    }

    public function test_store_creates_user()
    {
        $role = Role::create(['nombre' => 'Test Role', 'descripcion' => 'D', 'created_by' => $this->admin->id]);

        $response = $this->postJson(self::ENDPOINT, [
            self::ATTR_NAME => 'New User',
            'username' => 'newuser',
            self::ATTR_EMAIL => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => [$role->id],
        ]);

        $response->assertStatus(201)->assertJsonFragment([self::ATTR_NAME => 'New User']);
        $this->assertDatabaseHas(self::TABLE, [self::ATTR_EMAIL => 'newuser@example.com']);
    }

    public function test_show_returns_user()
    {
        $user = User::factory()->create();
        $response = $this->getJson(self::ENDPOINT.'/'.$user->id);
        $response->assertStatus(200)->assertJsonFragment([self::ATTR_EMAIL => $user->email]);
    }

    public function test_update_modifies_user()
    {
        $user = User::factory()->create();
        $response = $this->putJson(self::ENDPOINT.'/'.$user->id, [
            self::ATTR_NAME => 'Updated Name',
            'username' => $user->username,
            self::ATTR_EMAIL => $user->email,
        ]);
        $response->assertStatus(200)->assertJsonFragment([self::ATTR_NAME => 'Updated Name']);
        $this->assertDatabaseHas(self::TABLE, ['id' => $user->id, self::ATTR_NAME => 'Updated Name']);
    }

    public function test_destroy_deletes_user()
    {
        $user = User::factory()->create();
        $response = $this->deleteJson(self::ENDPOINT.'/'.$user->id);
        $response->assertStatus(200);
        $this->assertDatabaseMissing(self::TABLE, ['id' => $user->id, 'deleted_at' => null]);
    }
}
