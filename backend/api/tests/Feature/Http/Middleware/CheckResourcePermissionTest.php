<?php

namespace Tests\Feature\Http\Middleware;

use App\Http\Middleware\CheckResourcePermission;
use App\Models\Permiso;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class CheckResourcePermissionTest extends TestCase
{
    use RefreshDatabase;

    protected function createMiddlewareRequest($method, $routeName, $user = null)
    {
        $request = Request::create('/test', $method);
        if ($routeName) {
            $route = new Route($method, '/test', ['as' => $routeName]);
            $request->setRouteResolver(function () use ($route) {
                return $route;
            });
        }
        if ($user) {
            $request->setUserResolver(function () use ($user) {
                return $user;
            });
        }
        return $request;
    }

    public function test_unauthenticated_user_returns_401()
    {
        $middleware = new CheckResourcePermission();
        $request = $this->createMiddlewareRequest('GET', 'recurso.index');
        
        $response = $middleware->handle($request, function () {});
        
        $this->assertEquals(401, $response->getStatusCode());
        $this->assertEquals('No autorizado', json_decode($response->getContent())->message);
    }

    public function test_unsupported_method_returns_405()
    {
        $middleware = new CheckResourcePermission();
        $user = User::factory()->create();
        $request = $this->createMiddlewareRequest('OPTIONS', 'recurso.index', $user);
        
        $response = $middleware->handle($request, function () {});
        
        $this->assertEquals(405, $response->getStatusCode());
        $this->assertEquals('Método HTTP no soportado', json_decode($response->getContent())->message);
    }

    public function test_no_route_name_passes()
    {
        $middleware = new CheckResourcePermission();
        $user = User::factory()->create();
        $request = $this->createMiddlewareRequest('GET', null, $user);
        
        $passed = false;
        $middleware->handle($request, function () use (&$passed) {
            $passed = true;
            return new Response();
        });
        
        $this->assertTrue($passed);
    }

    public function test_generated_route_name_passes()
    {
        $middleware = new CheckResourcePermission();
        $user = User::factory()->create();
        $request = $this->createMiddlewareRequest('GET', 'generated::123', $user);
        
        $passed = false;
        $middleware->handle($request, function () use (&$passed) {
            $passed = true;
            return new Response();
        });
        
        $this->assertTrue($passed);
    }

    public function test_user_with_permission_passes()
    {
        $user = User::factory()->create();
        $role = Role::create(['nombre' => 'Admin', 'descripcion' => 'Administrador', 'created_by' => $user->id]);
        $permiso = Permiso::create(['nombre' => 'Leer', 'accion' => 'READ', 'recurso' => 'incidencias', 'descripcion' => 'Leer incidencias', 'created_by' => $user->id]);
        $role->permisos()->attach($permiso);
        $user->roles()->attach($role);

        $middleware = new CheckResourcePermission();
        $request = $this->createMiddlewareRequest('GET', 'incidencias.index', $user);
        
        $passed = false;
        $middleware->handle($request, function () use (&$passed) {
            $passed = true;
            return new Response();
        });
        
        $this->assertTrue($passed);
    }

    public function test_user_without_read_permission_returns_403()
    {
        $user = User::factory()->create();
        $middleware = new CheckResourcePermission();
        $request = $this->createMiddlewareRequest('GET', 'incidencias.index', $user);
        
        $response = $middleware->handle($request, function () {});
        
        $this->assertEquals(403, $response->getStatusCode());
        $this->assertEquals('No tiene permisos para consultar este recurso: incidencias', json_decode($response->getContent())->message);
    }

    public function test_user_without_create_permission_returns_403()
    {
        $user = User::factory()->create();
        $middleware = new CheckResourcePermission();
        $request = $this->createMiddlewareRequest('POST', 'incidencias.store', $user);
        
        $response = $middleware->handle($request, function () {});
        
        $this->assertEquals(403, $response->getStatusCode());
        $this->assertEquals('No tiene permisos para crear este recurso: incidencias', json_decode($response->getContent())->message);
    }

    public function test_user_without_update_permission_returns_403()
    {
        $user = User::factory()->create();
        $middleware = new CheckResourcePermission();
        $request = $this->createMiddlewareRequest('PUT', 'incidencias.update', $user);
        
        $response = $middleware->handle($request, function () {});
        
        $this->assertEquals(403, $response->getStatusCode());
        $this->assertEquals('No tiene permisos para actualizar este recurso: incidencias', json_decode($response->getContent())->message);
    }

    public function test_user_without_delete_permission_returns_403()
    {
        $user = User::factory()->create();
        $middleware = new CheckResourcePermission();
        $request = $this->createMiddlewareRequest('DELETE', 'incidencias.destroy', $user);
        
        $response = $middleware->handle($request, function () {});
        
        $this->assertEquals(403, $response->getStatusCode());
        $this->assertEquals('No tiene permisos para eliminar este recurso: incidencias', json_decode($response->getContent())->message);
    }
}
