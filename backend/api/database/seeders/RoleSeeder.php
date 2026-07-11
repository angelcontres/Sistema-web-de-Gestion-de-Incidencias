<?php

namespace Database\Seeders;

use App\Models\Permiso;
use App\Models\Role;
use App\Models\User;
use App\Services\Contracts\PermissionServiceInterface;
use App\Services\Contracts\RoleServiceInterface;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => 'holamundo',
        ]);

        $adminRole = Role::create([
            'nombre' => 'Admin',
            'descripcion' => 'Acceso total a todos los módulos del sistema.',
            'padre_id' => null,
            'created_by' => $user->id,
        ]);

        $roleService = app(RoleServiceInterface::class);
        $permissionService = app(PermissionServiceInterface::class);

        $roleService->syncRolesToUser($user, [$adminRole->id]);

        $supervisorRole = Role::create([
            'nombre' => 'Supervisor',
            'descripcion' => 'Supervisor que gestiona y despacha incidencias.',
            'padre_id' => null,
            'created_by' => $user->id,
        ]);

        Role::create([
            'nombre' => 'Institucion',
            'descripcion' => 'Instituciones que solventa, ejem: Bomberos, Policias, etc',
            'padre_id' => null,
            'created_by' => $user->id,
        ]);

        Role::create([
            'nombre' => 'Ciudadano',
            'descripcion' => 'Ciudadano que reporta incidencias',
            'padre_id' => null,
            'created_by' => $user->id,
        ]);

        // Assign all existing permissions to the Admin role
        $allPermissionsIds = Permiso::pluck('id')->toArray();
        $permissionService->syncPermissionsToRole($adminRole, $allPermissionsIds);

        // Assign specific permissions to the Supervisor role using Enums
        $permissionService->grantPermissionsToRole($supervisorRole, [
            \App\Enums\PermissionsEnum::READ_PAISES,
            \App\Enums\PermissionsEnum::READ_TERRITORIOS,
            \App\Enums\PermissionsEnum::READ_DIRECCIONES,
            \App\Enums\PermissionsEnum::READ_CATEGORIAS_INCIDENCIA,
            \App\Enums\PermissionsEnum::READ_INCIDENCIAS,
            \App\Enums\PermissionsEnum::UPDATE_INCIDENCIAS,
            \App\Enums\PermissionsEnum::READ_DESPACHO_INCIDENCIAS,
            \App\Enums\PermissionsEnum::UPDATE_DESPACHO_INCIDENCIAS,
            \App\Enums\PermissionsEnum::READ_HISTORIAL,
        ]);

        $institucionRole = Role::where('nombre', 'Institucion')->first();
        if ($institucionRole) {
            $permissionService->grantPermissionsToRole($institucionRole, [
                \App\Enums\PermissionsEnum::READ_PAISES,
                \App\Enums\PermissionsEnum::READ_TERRITORIOS,
                \App\Enums\PermissionsEnum::READ_DIRECCIONES,
                \App\Enums\PermissionsEnum::READ_KANBAN,
                \App\Enums\PermissionsEnum::CREATE_KANBAN,
                \App\Enums\PermissionsEnum::UPDATE_KANBAN,
                \App\Enums\PermissionsEnum::DELETE_KANBAN,
            ]);
        }

        // Assign specific permissions to the Ciudadano role using Enums
        $ciudadanoRole = Role::where('nombre', 'Ciudadano')->first();
        if ($ciudadanoRole) {
            $permissionService->grantPermissionsToRole($ciudadanoRole, [
                \App\Enums\PermissionsEnum::READ_INCIDENCIAS,
                \App\Enums\PermissionsEnum::CREATE_INCIDENCIAS,
                \App\Enums\PermissionsEnum::READ_DIRECCIONES,
                \App\Enums\PermissionsEnum::CREATE_DIRECCIONES,
                \App\Enums\PermissionsEnum::READ_HISTORIAL,
            ]);
        }

        // Verificamos en consola
        $adminPermisosCount = $adminRole->permisos()->count();
        $supervisorPermisosCount = $supervisorRole->permisos()->count();

        echo "--- RESULTADO DEL TEST DE PERMISOS ---\n";

        echo 'Permisos de Admin (Deberían ser '.count($allPermissionsIds).'): '.$adminPermisosCount."\n";
        echo 'Permisos de Supervisor (Deberían ser 9): '.$supervisorPermisosCount."\n";
        echo "--------------------------------------\n";
    }
}
