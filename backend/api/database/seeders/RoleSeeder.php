<?php

namespace Database\Seeders;

use App\Models\Permiso;
use App\Models\Role;
use App\Models\User;
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

        $user->roles()->sync([$adminRole->id]);

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

        // Assign all existing permissions to the Admin role
        $allPermissionsIds = Permiso::pluck('id')->toArray();
        $adminRole->permisos()->sync($allPermissionsIds);

        // Assign specific permissions to the Operador role
        $operadorPermissions = Permiso::whereIn('recurso', ['ubicaciones', 'paises', 'territorios', 'direcciones'])
            ->where(function ($query) {
                // Operators can only view countries (READ), not modify them
                $query->where(function ($q) {
                    $q->where('recurso', 'paises')->where('accion', 'READ');
                })
                // Operators have full CRUD for the main menu, territories, and addresses
                ->orWhereIn('recurso', ['ubicaciones', 'territorios', 'direcciones']);
            })
            ->pluck('id')
            ->toArray();

        $operadorRole->permisos()->sync($operadorPermissions);

        // Verificamos en consola
        $adminPermisosCount = $adminRole->permisos()->count();
        $operadorPermisosCount = $operadorRole->permisos()->count();

        echo "--- RESULTADO DEL TEST DE PERMISOS ---\n";
        echo 'Permisos de Admin (Deberían ser '.count($allPermissionsIds).'): '.$adminPermisosCount."\n";
        echo 'Permisos de Operador (Deberían ser ' . count($operadorPermissions) . '): '.$operadorPermisosCount."\n";
        echo "--------------------------------------\n";
    }
}
