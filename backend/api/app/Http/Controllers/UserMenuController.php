<?php

namespace App\Http\Controllers;

use App\Models\OpcionMenu;
use App\Models\User;
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
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'status' => 'success',
                'data' => [],
            ]);
        }

        $isAdmin = $user->roles()->where('nombre', 'Admin')->exists();

        if (! $isAdmin) {
            $allowedIds = $this->getAllowedMenuIdsForUser($user);
            $query->whereIn('id', $allowedIds);
        }

        $opciones = $query->with('padre')->get();

        return response()->json([
            'status' => 'success',
            'data' => $opciones,
        ]);
    }

    private function getAllowedMenuIdsForUser(User $user)
    {
        $menuIds = $this->getMenuIdsFromPermissions($user);
        $allowedIds = $this->includeParentMenuIds($menuIds);
        $allowedIds = $this->ensureDashboardIsVisible($allowedIds);
        $allowedIds = $this->applyInstitucionExceptions($user, $allowedIds);

        return $allowedIds->values();
    }

    private function getMenuIdsFromPermissions(User $user)
    {
        $user->load('roles.permisos');
        $menuIds = collect();
        foreach ($user->roles as $role) {
            foreach ($role->permisos as $permiso) {
                if ($permiso->opcion_menu_id) {
                    $menuIds->push($permiso->opcion_menu_id);
                }
            }
        }
        return $menuIds->unique();
    }

    private function includeParentMenuIds($menuIds)
    {
        $allowedIds = collect($menuIds);
        $currentIdsToSearch = $menuIds;

        while ($currentIdsToSearch->isNotEmpty()) {
            $parentIds = OpcionMenu::whereIn('id', $currentIdsToSearch)
                ->whereNotNull('padre_id')
                ->pluck('padre_id')
                ->unique();

            $newParents = $parentIds->diff($allowedIds);

            if ($newParents->isEmpty()) {
                break;
            }

            $allowedIds = $allowedIds->merge($newParents);
            $currentIdsToSearch = $newParents;
        }

        return $allowedIds;
    }

    private function ensureDashboardIsVisible($allowedIds)
    {
        $dashboardId = OpcionMenu::where('nombre', 'Dashboard')->value('id');
        if ($dashboardId) {
            $allowedIds->push($dashboardId);
        }
        return $allowedIds;
    }

    private function applyInstitucionExceptions(User $user, $allowedIds)
    {
        if ($user->roles()->where('nombre', 'Institucion')->exists()) {
            $incidenciasMenuId = OpcionMenu::where('nombre', 'Incidencias')->value('id');
            if ($incidenciasMenuId) {
                return $allowedIds->reject(function ($id) use ($incidenciasMenuId) {
                    return $id == $incidenciasMenuId;
                });
            }
        }
        return $allowedIds;
    }
}
