<?php

namespace App\Http\Middleware;

use App\Enums\PermissionsEnum;
use App\Services\Contracts\PermissionServiceInterface;
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
        $hasPerm = false;

        // Admin role has all permissions
        if ($user && $user->roles()->where('nombre', 'Admin')->exists()) {
            $hasPerm = true;
        } elseif ($permission === 'Ver Opción de Menú' && $request->boolean('for_sidebar')) {
            // Allow any authenticated user to view menu options specifically filtered for the sidebar
            $hasPerm = true;
        } else {
            $enum = PermissionsEnum::tryFrom($permission);
            $hasPerm = $enum 
                ? app(PermissionServiceInterface::class)->userHasPermission($user, $enum) 
                : ($user ? $user->hasPermission($permission) : false);
        }

        if (! $hasPerm) {
            return response()->json([
                'message' => 'No tiene autorización para realizar esta acción. Se requiere el permiso: '.$permission,
            ], 403);
        }

        return $next($request);
    }
}
