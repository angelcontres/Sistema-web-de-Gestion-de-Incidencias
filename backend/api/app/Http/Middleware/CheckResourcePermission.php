<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckResourcePermission
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // If no user is authenticated, we assume other middlewares (like auth:sanctum) will handle it,
        // but just in case, we return 401.
        if (! $user) {
            return response()->json(['message' => 'No autorizado'], 401);
        }



        // Action Mapping
        $method = $request->method();
        $accion = match ($method) {
            'GET' => 'READ',
            'POST' => 'CREATE',
            'PUT', 'PATCH' => 'UPDATE',
            'DELETE' => 'DELETE',
            default => null,
        };

        if (! $accion) {
            return response()->json(['message' => 'Método HTTP no soportado'], 405);
        }

        $routeName = $request->route() ? $request->route()->getName() : null;

        // Si la ruta no tiene nombre explícito o es auto-generada por Laravel 11, se asume que no está protegida por recursos (ej. /v1/me, /v1/logout)
        if (! $routeName || str_starts_with($routeName, 'generated::')) {
            return $next($request);
        }

        // Extraer el recurso base del nombre de la ruta (ej: "opciones.index" -> "opciones")
        $recurso = explode('.', $routeName)[0];

        // Validation
        $user->load('roles.permisos');
        $hasPermission = false;

        foreach ($user->roles as $role) {
            foreach ($role->permisos as $permiso) {
                if ($permiso->accion === $accion && $permiso->recurso === $recurso) {
                    $hasPermission = true;
                    break 2;
                }


            }
        }

        if (! $hasPermission) {

            $strAccionLower = strtolower($accion);

            if ($strAccionLower == 'read') {
                return response()->json([
                    'message' => 'No tiene permisos para consultar este recurso: '.strtolower($recurso),
                ], 403);
            }
            if ($strAccionLower == 'create') {
                return response()->json([
                    'message' => 'No tiene permisos para crear este recurso: '.strtolower($recurso),
                ], 403);
            }
            if ($strAccionLower == 'update') {
                return response()->json([
                    'message' => 'No tiene permisos para actualizar este recurso: '.strtolower($recurso),
                ], 403);
            }
            if ($strAccionLower == 'delete') {
                return response()->json([
                    'message' => 'No tiene permisos para eliminar este recurso'.strtolower($recurso),
                ], 403);
            }

            return response()->json([
                'message' => 'No tiene permisos '.strtolower($recurso).':'.strtolower($accion),
            ], 403);
        }

        return $next($request);
    }
}
