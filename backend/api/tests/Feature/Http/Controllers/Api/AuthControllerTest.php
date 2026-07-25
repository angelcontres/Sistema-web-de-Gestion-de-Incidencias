<?php

namespace Tests\Feature\Http\Controllers\Api;

use App\Models\Permiso;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    const EMAIL_TEST_STRING = 'test@test.com';

    use RefreshDatabase;

    public function test_login_success()
    {
        User::factory()->create([
            'email' => self::EMAIL_TEST_STRING,
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/v1/login', [
            'login' => self::EMAIL_TEST_STRING,
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['access_token', 'token_type']);
    }

    public function test_login_failure()
    {
        User::factory()->create([
            'email' => self::EMAIL_TEST_STRING,
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/v1/login', [
            'login' => self::EMAIL_TEST_STRING,
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJsonFragment(['message' => 'Las credenciales no coinciden con nuestros registros.']);
    }

    public function test_logout_success()
    {
        $user = User::factory()->create();
        $role = Role::create(['nombre' => 'Admin', 'descripcion' => 'Admin role', 'created_by' => $user->id]);
        $user->roles()->attach($role->id);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/logout');
        $response->assertStatus(200)
            ->assertJsonFragment(['message' => 'Sesión cerrada exitosamente.']);
    }

    public function test_me_returns_user_data()
    {
        $user = User::factory()->create();
        $role = Role::create(['nombre' => 'Test', 'descripcion' => 'D', 'created_by' => $user->id]);
        $user->roles()->attach($role->id);

        $permiso = Permiso::create([
            'nombre' => 'Ver',
            'accion' => 'READ',
            'recurso' => 'algo',
        ]);
        $role->permisos()->attach($permiso->id);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/me');
        $response->assertStatus(200)
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonPath('user.is_admin', false)
            ->assertJsonPath('user.permisos.0', 'READ_ALGO');
    }

    public function test_refresh_token()
    {
        $user = User::factory()->create();
        $role = Role::create(['nombre' => 'Admin', 'descripcion' => 'Admin role', 'created_by' => $user->id]);
        $user->roles()->attach($role->id);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/refresh');
        $response->assertStatus(200)
            ->assertJsonStructure(['access_token', 'token_type']);
    }
}
