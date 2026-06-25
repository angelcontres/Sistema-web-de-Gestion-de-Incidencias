<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        // Admin role has all permissions
        if ($user && $user->roles()->where('nombre', 'Admin')->exists()) {
            return $next($request);
        }

        // Allow any authenticated user to view menu options specifically filtered for the sidebar
        if ($permission === 'Ver Opción de Menú' && $request->boolean('for_sidebar')) {
            return $next($request);
        }

        if (! $user || ! $user->hasPermission($permission)) {
            return response()->json([
                'message' => 'No tiene autorización para realizar esta acción. Se requiere el permiso: '.$permission,
            ], 403);
        }

        return $next($request);
    }
}
