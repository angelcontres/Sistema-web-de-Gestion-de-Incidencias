<?php

namespace Tests\Feature;

use App\Models\OpcionMenu;
use App\Models\Permiso;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    const ENDPOINT_INCIDENTS = '/api/v1/incidents';

    const ENDPOINT_ROLES = '/api/v1/roles';

    const ENDPOINT_ME_MENU = '/api/v1/me/menu';

    // CP-S-01: Acceso sin autenticación
    public function test_cannot_access_protected_route_without_token()
    {
        $response = $this->getJson(self::ENDPOINT_INCIDENTS);
        $response->assertStatus(401);
    }

    // CP-S-02: Acceso con rol no autorizado
    public function test_ciudadano_cannot_access_admin_routes()
    {
        $ciudadano = User::factory()->create();
        $rolCiudadano = Role::firstOrCreate(['nombre' => 'Ciudadano'], ['descripcion' => 'Ciudadano', 'created_by' => $ciudadano->id]);
        $ciudadano->roles()->sync([$rolCiudadano->id]);

        // Intentar acceder a rutas de administración de roles (requiere Admin)
        $response = $this->actingAs($ciudadano)->getJson(self::ENDPOINT_ROLES);

        // Verifica si retorna 403 Forbidden
        $response->assertStatus(403);
    }

    // CP-S-03: Manipulación de token
    public function test_rejects_invalid_or_manipulated_token()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer invalid_and_manipulated_token_string',
        ])->getJson(self::ENDPOINT_INCIDENTS);

        $response->assertStatus(401);
    }

    // CP-S-04: Expiración de sesión (Simulado o token revocado)
    public function test_cannot_access_after_logout_or_token_revocation()
    {
        $user = User::factory()->create();

        // Simular login manual para obtener token real
        $token = $user->createToken('test-token')->plainTextToken;

        // Revocar token (equivalente a expirar sesión)
        $user->tokens()->delete();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
        ])->getJson(self::ENDPOINT_INCIDENTS);

        $response->assertStatus(401);
    }

    // CP-S-05: Ocultamiento de opciones menú según rol
    public function test_menu_options_are_filtered_by_role()
    {
        $admin = User::factory()->create();
        $rolAdmin = Role::firstOrCreate(['nombre' => 'Admin'], ['descripcion' => 'Admin', 'created_by' => $admin->id]);
        $admin->roles()->sync([$rolAdmin->id]);

        $ciudadano = User::factory()->create();
        $rolCiudadano = Role::firstOrCreate(['nombre' => 'Ciudadano'], ['descripcion' => 'Ciudadano', 'created_by' => $admin->id]);
        $ciudadano->roles()->sync([$rolCiudadano->id]);

        // Crear una opción de menú y un permiso asignado solo a Admin
        $opcion = OpcionMenu::firstOrCreate([
            'nombre' => 'Roles',
            'ruta' => '/roles',
            'created_by' => $admin->id,
        ]);
        $permisoAdmin = Permiso::firstOrCreate(['nombre' => 'Gestionar Roles', 'recurso' => 'roles', 'accion' => 'READ', 'opcion_menu_id' => $opcion->id]);
        $rolAdmin->permisos()->sync([$permisoAdmin->id]);

        // Admin debería ver la opción
        $responseAdmin = $this->actingAs($admin)->getJson(self::ENDPOINT_ME_MENU);
        $responseAdmin->assertStatus(200);
        $dataAdmin = $responseAdmin->json('data');

        // Ciudadano no debería ver la opción
        $responseCiudadano = $this->actingAs($ciudadano)->getJson(self::ENDPOINT_ME_MENU);
        $responseCiudadano->assertStatus(200);
        $dataCiudadano = $responseCiudadano->json('data');

        $this->assertTrue(collect($dataAdmin)->contains('nombre', 'Roles'));
        $this->assertFalse(collect($dataCiudadano)->contains('nombre', 'Roles'));
    }

    public function test_admin_can_delete_user_and_removes_roles_and_tokens()
    {
        // 1. Crear el usuario Admin para autenticar la petición
        $admin = $this->createAdminUser();

        // 2. Crear el usuario que será eliminado (con roles y tokens)
        $targetUser = User::factory()->create();
        $rolCiudadano = Role::firstOrCreate(['nombre' => 'Ciudadano'], ['descripcion' => 'Ciudadano', 'created_by' => $admin->id]);
        $targetUser->roles()->sync([$rolCiudadano->id]);

        // Crear un token de Sanctum para el usuario a eliminar
        $targetUser->createToken('test-token');

        // Verificar que el usuario tiene roles y tokens antes de eliminar
        $this->assertDatabaseHas('roles_users', [
            'user_id' => $targetUser->id,
            'rol_id' => $rolCiudadano->id,
        ]);
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $targetUser->id,
            'tokenable_type' => User::class,
        ]);

        // 3. Ejecutar la petición DELETE actuando como Admin
        $response = $this->actingAs($admin)
            ->deleteJson("/api/v1/users/{$targetUser->id}");

        // 4. Aserciones
        $response->assertStatus(200);
        $response->assertJsonFragment(['message' => 'Usuario eliminado con éxito']);

        // Verificar que el usuario fue borrado de la base de datos
        $this->assertDatabaseMissing('users', ['id' => $targetUser->id]);

        // Verificar que se eliminaron sus relaciones en roles_users y personal_access_tokens
        $this->assertDatabaseMissing('roles_users', ['user_id' => $targetUser->id]);
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $targetUser->id,
            'tokenable_type' => User::class,
        ]);
    }
    public function test_citizen_frictionless_signup()
    {
        $admin = User::factory()->create();
        Role::firstOrCreate(['nombre' => 'Ciudadano'], ['descripcion' => 'Ciudadano', 'created_by' => $admin->id]);
        Role::firstOrCreate(['nombre' => 'Admin'], ['descripcion' => 'Admin', 'created_by' => $admin->id]);

        // Fallo de validación
        $responseInvalid = $this->postJson('/api/v1/auth/register-citizen', [
            'username' => 'testuser',
            'password' => '123'
        ]);
        $responseInvalid->assertStatus(422);

        // Registro exitoso
        $responseSuccess = $this->postJson('/api/v1/auth/register-citizen', [
            'username' => 'newcitizen',
            'email' => 'citizen@example.com',
            'password' => 'secret123',
            'role' => 'Admin', // Intentar inyectar Admin
        ]);

        $responseSuccess->assertStatus(201);
        $responseSuccess->assertJsonStructure(['access_token', 'user' => ['id', 'email', 'username']]);

        $user = User::where('email', 'citizen@example.com')->first();
        $this->assertNotNull($user->email_verified_at);
        $this->assertTrue($user->roles->contains('nombre', 'Ciudadano'));
        $this->assertFalse($user->roles->contains('nombre', 'Admin'));
    }
}
