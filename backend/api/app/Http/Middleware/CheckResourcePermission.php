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

        // Resource Parsing
        $segments = $request->segments();
        $recurso = null;

        foreach ($segments as $index => $segment) {
            if ($segment === 'v1' && isset($segments[$index + 1])) {
                $recurso = $segments[$index + 1];
                break;
            }
        }

        // Some specific routes shouldn't be blocked here
        $ignoredResources = ['login', 'logout', 'me', 'me/menu'];
        if (! $recurso || in_array($recurso, $ignoredResources) || $request->is('api/v1/me/menu')) {
            return $next($request);
        }

        // Map specific API URL segments to their single-word DB resource names
        $recursoMap = [
            'opciones-menu' => 'opciones',
            'categorias-incidencia' => 'categorias',
        ];

        $recurso = $recursoMap[$recurso] ?? $recurso;

        // Replace hyphens with underscores just in case for any other resource, though we prefer single words
        $recurso = str_replace('-', '_', $recurso);

        // Validation
        $permissionKey = strtoupper($accion.'_'.$recurso);
        $hasPermission = $user->hasPermission($permissionKey);

        if (! $hasPermission) {

            $strAccionLower = strtolower($accion);
            $mensaje = match ($strAccionLower) {
                'read' => 'No tiene permisos para consultar este recurso: '.strtolower($recurso),
                'create' => 'No tiene permisos para crear este recurso: '.strtolower($recurso),
                'update' => 'No tiene permisos para actualizar este recurso: '.strtolower($recurso),
                'delete' => 'No tiene permisos para eliminar este recurso: '.strtolower($recurso),
            };

            return response()->json([
                'message' => $mensaje,
            ], 403);
        }

        return $next($request);
    }
}
