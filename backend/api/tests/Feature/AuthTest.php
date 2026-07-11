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

    // CP-S-01: Acceso sin autenticación
    public function test_cannot_access_protected_route_without_token()
    {
        $response = $this->getJson('/api/v1/incidencias');
        $response->assertStatus(401);
    }

    // CP-S-02: Acceso con rol no autorizado
    public function test_ciudadano_cannot_access_admin_routes()
    {
        $ciudadano = User::factory()->create();
        $rolCiudadano = Role::firstOrCreate(['nombre' => 'Ciudadano'], ['descripcion' => 'Ciudadano', 'created_by' => $ciudadano->id]);
        $ciudadano->roles()->sync([$rolCiudadano->id]);

        // Intentar acceder a rutas de administración de roles (requiere Admin)
        $response = $this->actingAs($ciudadano)->getJson('/api/v1/roles');

        // Verifica si retorna 403 Forbidden
        $response->assertStatus(403);
    }

    // CP-S-03: Manipulación de token
    public function test_rejects_invalid_or_manipulated_token()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer invalid_and_manipulated_token_string',
        ])->getJson('/api/v1/incidencias');

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
        ])->getJson('/api/v1/incidencias');

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
            'orden' => 1,
            'activo' => true,
            'created_by' => $admin->id,
        ]);
        $permisoAdmin = Permiso::firstOrCreate(['nombre' => 'Gestionar Roles', 'recurso' => 'roles', 'accion' => 'READ', 'opcion_menu_id' => $opcion->id]);
        $rolAdmin->permisos()->sync([$permisoAdmin->id]);

        // Admin debería ver la opción
        $responseAdmin = $this->actingAs($admin)->getJson('/api/v1/me/menu');
        $responseAdmin->assertStatus(200);
        $dataAdmin = $responseAdmin->json('data');

        // Ciudadano no debería ver la opción
        $responseCiudadano = $this->actingAs($ciudadano)->getJson('/api/v1/me/menu');
        $responseCiudadano->assertStatus(200);
        $dataCiudadano = $responseCiudadano->json('data');

        $this->assertTrue(collect($dataAdmin)->contains('nombre', 'Roles'));
        $this->assertFalse(collect($dataCiudadano)->contains('nombre', 'Roles'));
    }
}
