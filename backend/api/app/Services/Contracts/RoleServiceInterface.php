<?php

namespace App\Services\Contracts;

use App\Models\Role;
use App\Models\User;

interface RoleServiceInterface
{
    /**
     * Obtener todos los roles.
     */
    public function getAllRoles();

    /**
     * Obtener un rol por su ID con sus permisos.
     */
    public function getRoleById(int $id): ?Role;

    /**
     * Asignar un rol específico a un usuario por nombre.
     */
    public function assignRoleToUser(User $user, string $roleNombre): void;

    /**
     * Sincronizar roles de un usuario por IDs (reemplaza los existentes).
     */
    public function syncRolesToUser(User $user, array $roleIds): void;
}
