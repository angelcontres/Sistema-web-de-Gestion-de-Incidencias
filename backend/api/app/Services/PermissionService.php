<?php

namespace App\Services;

use App\Enums\PermissionsEnum;
use App\Models\Permiso;
use App\Models\Role;
use App\Models\User;
use App\Services\Contracts\PermissionServiceInterface;

class PermissionService implements PermissionServiceInterface
{
    /**
     * Otorgar permisos a un rol mediante Enums.
     */
    public function grantPermissionsToRole(Role $role, array $permissionsEnums): void
    {
        $permissionNames = array_map(function ($enum) {
            return $enum->value;
        }, $permissionsEnums);

        $permissions = Permiso::whereIn('nombre', $permissionNames)->pluck('id')->toArray();

        $role->permisos()->syncWithoutDetaching($permissions);
    }

    /**
     * Sincronizar permisos a un rol por IDs (reemplaza los existentes).
     */
    public function syncPermissionsToRole(Role $role, array $permissionIds): void
    {
        $role->permisos()->sync($permissionIds);
    }

    /**
     * Comprobar si un usuario tiene un permiso específico (Enum).
     */
    public function userHasPermission(User $user, PermissionsEnum $permission): bool
    {
        // En una aplicación real, se podría cachear esto
        foreach ($user->roles()->with('permisos')->get() as $role) {
            foreach ($role->permisos as $perm) {
                if (strtolower($perm->nombre) === strtolower($permission->value)) {
                    return true;
                }
            }
        }

        return false;
    }
}
