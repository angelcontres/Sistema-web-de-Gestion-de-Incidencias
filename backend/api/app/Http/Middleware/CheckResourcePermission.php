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

        if (! $user) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $accion = match ($request->method()) {
            'GET' => 'READ',
            'POST' => 'CREATE',
            'PUT', 'PATCH' => 'UPDATE',
            'DELETE' => 'DELETE',
            default => null,
        };

        $routeName = $request->route()?->getName();
        $errorResponse = null;

        if (! $accion) {
            $errorResponse = response()->json(['message' => 'Método HTTP no soportado'], 405);
        } elseif ($routeName && ! str_starts_with($routeName, 'generated::')) {
            $recurso = explode('.', $routeName)[0];
            $user->loadMissing('roles.permisos');
            
            $hasPermission = $user->roles->flatMap->permisos
                ->contains(fn ($permiso) => $permiso->accion === $accion && $permiso->recurso === $recurso);
                
            if (! $hasPermission) {
                $errorResponse = $this->buildErrorResponse($accion, $recurso);
            }
        }

        return $errorResponse ?: $next($request);
    }

    private function buildErrorResponse(string $accion, string $recurso): Response
    {
        $accionLower = strtolower($accion);
        $recursoLower = strtolower($recurso);

        $message = match ($accionLower) {
            'read' => "No tiene permisos para consultar este recurso: {$recursoLower}",
            'create' => "No tiene permisos para crear este recurso: {$recursoLower}",
            'update' => "No tiene permisos para actualizar este recurso: {$recursoLower}",
            'delete' => "No tiene permisos para eliminar este recurso: {$recursoLower}",
            default => "No tiene permisos {$recursoLower}:{$accionLower}",
        };

        return response()->json(['message' => $message], 403);
    }
}
