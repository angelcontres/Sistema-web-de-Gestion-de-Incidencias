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

        $operadorRole = Role::create([
            'nombre' => 'Operador',
            'descripcion' => 'EL que opera XDDD',
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

        // Assign specific permissions to the Operador role
        $operadorPermissions = Permiso::where(function ($q) {
            $q->whereIn('recurso', ['paises', 'territorios', 'direcciones', 'categorias_incidencia'])
              ->where('accion', 'READ');
        })->orWhere(function ($q) {
            $q->whereIn('recurso', ['incidencias', 'despacho_de_incidencias'])
              ->whereIn('accion', ['READ', 'UPDATE']);
        })->pluck('id')->toArray();
        $permissionService->syncPermissionsToRole($operadorRole, $operadorPermissions);

        // Assign specific permissions to the Institucion role
        $institucionRole = Role::where('nombre', 'Institucion')->first();
        if ($institucionRole) {
            $institucionPermissions = Permiso::where(function ($q) {
                $q->whereIn('recurso', ['incidencias'])
                  ->whereIn('accion', ['READ', 'UPDATE']);
            })->orWhere(function ($q) {
                $q->where('recurso', 'direcciones')
                  ->where('accion', 'READ');
            })->orWhere(function ($q) {
                $q->where('recurso', 'kanban'); // CRUD for kanban
            })->pluck('id')->toArray();
            $permissionService->syncPermissionsToRole($institucionRole, $institucionPermissions);
        }

        // Assign specific permissions to the Ciudadano role
        $ciudadanoRole = Role::where('nombre', 'Ciudadano')->first();
        if ($ciudadanoRole) {
            $ciudadanoPermissions = Permiso::whereIn('recurso', ['incidencias', 'direcciones'])
                ->whereIn('accion', ['READ', 'CREATE'])
                ->pluck('id')
                ->toArray();
            $permissionService->syncPermissionsToRole($ciudadanoRole, $ciudadanoPermissions);
        }

        // Verificamos en consola
        $adminPermisosCount = $adminRole->permisos()->count();
        $operadorPermisosCount = $operadorRole->permisos()->count();

        echo "--- RESULTADO DEL TEST DE PERMISOS ---\n";

        echo 'Permisos de Admin (Deberían ser '.count($allPermissionsIds).'): '.$adminPermisosCount."\n";
        echo 'Permisos de Operador (Deberían ser '.count($operadorPermissions).'): '.$operadorPermisosCount."\n";
        echo "--------------------------------------\n";
    }
}
