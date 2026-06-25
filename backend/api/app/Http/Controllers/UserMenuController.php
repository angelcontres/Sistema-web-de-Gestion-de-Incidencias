<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\OpcionMenu;

class UserMenuController extends Controller
{
    /**
     * Get the allowed menu options for the authenticated user to build the sidebar.
     * Always includes the dashboard item implicitly.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user && $user->roles()->where('nombre', 'Admin')->exists();

        $query = OpcionMenu::query();

        if (!$isAdmin && $user) {
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

            // Always allow the Dashboard menu item (ruta '#/') for all authenticated users
            $dashboardMenu = OpcionMenu::where('ruta', '#/')->first();
            if ($dashboardMenu) {
                $allowedIds->push($dashboardMenu->id);
            }

            $query->whereIn('id', $allowedIds->values());
        }

        // Return flat list, frontend buildMenuTree will process it
        $opciones = $query->with('padre')->get();

        return response()->json([
            'status' => 'success',
            'data' => $opciones,
        ]);
    }
}
