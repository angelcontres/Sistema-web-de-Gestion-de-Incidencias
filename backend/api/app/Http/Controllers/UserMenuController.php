<?php

namespace App\Http\Controllers;

use App\Models\OpcionMenu;
use Illuminate\Http\Request;

class UserMenuController extends Controller
{
    /**
     * GET
     * Muestra las opciones de menú permitidas para el usuario autenticado (para el sidebar).
     */
    public function index(Request $request)
    {
        $query = OpcionMenu::query();
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'success',
                'data' => [],
            ]);
        }

        $isAdmin = $user->roles()->where('nombre', 'Admin')->exists();

        if (! $isAdmin) {
            // Get all menu IDs from user's permissions
            $user->load('roles.permisos');
            $menuIds = collect();
            foreach ($user->roles as $role) {
                foreach ($role->permisos as $permiso) {
                    if ($permiso->opcion_menu_id) {
                        $menuIds->push($permiso->opcion_menu_id);
                    }
                }
            }
            $menuIds = $menuIds->unique();

            // Recursively get all parent menu IDs
            $allowedIds = collect($menuIds);
            $currentIdsToSearch = $menuIds;

            while ($currentIdsToSearch->isNotEmpty()) {
                $parentIds = OpcionMenu::whereIn('id', $currentIdsToSearch)
                    ->whereNotNull('padre_id')
                    ->pluck('padre_id')
                    ->unique();

                // Filter out parents we already have to avoid infinite loops
                $newParents = $parentIds->diff($allowedIds);

                if ($newParents->isEmpty()) {
                    break;
                }

                $allowedIds = $allowedIds->merge($newParents);
                $currentIdsToSearch = $newParents;
            }

            // Asegurar que el Dashboard siempre esté visible para todos los roles
            $dashboardId = OpcionMenu::where('nombre', 'Dashboard')->value('id');
            if ($dashboardId) {
                $allowedIds->push($dashboardId);
            }

            $query->whereIn('id', $allowedIds->values());
        }

        $opciones = $query->with('padre')->get();

        return response()->json([
            'status' => 'success',
            'data' => $opciones,
        ]);
    }
}
