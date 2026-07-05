<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use App\Services\Contracts\RoleServiceInterface;

class RoleService implements RoleServiceInterface
{
    /**
     * Obtener todos los roles.
     */
    public function getAllRoles()
    {
        return Role::all();
    }

    /**
     * Obtener un rol por su ID con sus permisos.
     */
    public function getRoleById(int $id): ?Role
    {
        return Role::with('permisos')->find($id);
    }

    /**
     * Asignar un rol específico a un usuario por nombre.
     */
    public function assignRoleToUser(User $user, string $roleNombre): void
    {
        $role = Role::where('nombre', $roleNombre)->first();
        if ($role) {
            $user->roles()->syncWithoutDetaching([$role->id]);
        }
    }

    /**
     * Sincronizar roles de un usuario por IDs (reemplaza los existentes).
     */
    public function syncRolesToUser(User $user, array $roleIds): void
    {
        $user->roles()->sync($roleIds);
    }
}
