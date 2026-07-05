<?php

namespace App\Services\Contracts;

use App\Enums\PermissionsEnum;
use App\Models\Role;
use App\Models\User;

interface PermissionServiceInterface
{
    /**
     * Otorgar permisos a un rol mediante Enums.
     */
    public function grantPermissionsToRole(Role $role, array $permissionsEnums): void;

    /**
     * Sincronizar permisos a un rol por IDs (reemplaza los existentes).
     */
    public function syncPermissionsToRole(Role $role, array $permissionIds): void;

    /**
     * Comprobar si un usuario tiene un permiso específico (Enum).
     */
    public function userHasPermission(User $user, PermissionsEnum $permission): bool;
}
