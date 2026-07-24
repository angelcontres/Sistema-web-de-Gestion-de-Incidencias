<?php

namespace Tests\Feature\Http\Middleware;

use App\Http\Middleware\CheckPermission;
use App\Models\Permiso;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class CheckPermissionTest extends TestCase
{
    const string ROUTE_TEST = '/test';

    use RefreshDatabase;

    public function test_admin_bypasses_permissions()
    {
        $user = User::factory()->create();
        $role = Role::create(['nombre' => 'Admin', 'descripcion' => 'Admin role', 'created_by' => $user->id]);
        $user->roles()->attach($role->id);

        $request = Request::create(self::ROUTE_TEST, 'GET');
        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        $middleware = new CheckPermission;
        $response = $middleware->handle($request, function () {
            return new Response('OK');
        }, 'CUALQUIER_PERMISO');

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('OK', $response->getContent());
    }

    public function test_user_with_permission_is_allowed()
    {
        $user = User::factory()->create();
        $role = Role::create(['nombre' => 'User', 'descripcion' => 'User role', 'created_by' => $user->id]);
        $user->roles()->attach($role->id);

        $permiso = Permiso::create([
            'nombre' => 'Ver Incidencias',
            'accion' => 'READ',
            'recurso' => 'incidencias',
        ]);
        $role->permisos()->attach($permiso->id);

        $request = Request::create(self::ROUTE_TEST, 'GET');
        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        $middleware = new CheckPermission;
        $response = $middleware->handle($request, function () {
            return new Response('OK');
        }, 'READ_INCIDENCIAS');

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('OK', $response->getContent());
    }

    public function test_user_without_permission_is_forbidden()
    {
        $user = User::factory()->create();

        $request = Request::create(self::ROUTE_TEST, 'GET');
        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        $middleware = new CheckPermission;
        $response = $middleware->handle($request, function () {
            return new Response('OK');
        }, 'READ_INCIDENCIAS');

        $this->assertEquals(403, $response->getStatusCode());
    }

    public function test_sidebar_menu_option_bypasses_check_if_flag_is_true()
    {
        $user = User::factory()->create();

        $request = Request::create(self::ROUTE_TEST, 'GET', ['for_sidebar' => true]);
        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        $middleware = new CheckPermission;
        $response = $middleware->handle($request, function () {
            return new Response('OK');
        }, 'Ver Opción de Menú');

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('OK', $response->getContent());
    }
}
