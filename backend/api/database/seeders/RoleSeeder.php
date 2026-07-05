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
        $operadorPermissions = Permiso::whereIn('recurso', ['ubicaciones', 'paises', 'territorios', 'direcciones', 'categorias_incidencia', 'incidencias', 'despacho_de_incidencias'])
            ->where(function ($query) {
                // Operators can only view countries and categories (READ), not modify them
                $query->where(function ($q) {
                    $q->whereIn('recurso', ['paises', 'categorias_incidencia'])->where('accion', 'READ');
                })
                // Operators have full CRUD for the main menu, territories, addresses, incidents, and dispatch
                    ->orWhereIn('recurso', ['ubicaciones', 'territorios', 'direcciones', 'incidencias', 'despacho_de_incidencias']);
            })
            ->pluck('id')
            ->toArray();

        $permissionService->syncPermissionsToRole($operadorRole, $operadorPermissions);

        // Assign specific permissions to the Institucion role
        $institucionRole = Role::where('nombre', 'Institucion')->first();
        if ($institucionRole) {
            $institucionPermissions = Permiso::whereIn('recurso', ['incidencias', 'direcciones'])->pluck('id')->toArray();
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
