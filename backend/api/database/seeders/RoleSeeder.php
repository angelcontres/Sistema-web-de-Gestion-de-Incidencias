<?php

namespace Database\Seeders;

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
            'name'     => 'Admin',
            'email'    => 'admin@admin.com',
            'password' => 'holamundo',
        ]);

        $adminRole = Role::create([
            'nombre'      => 'Admin',
            'descripcion' => 'Acceso total a todos los módulos del sistema.',
            'padre_id'    => null,
            'created_by'  => $user->id,
        ]);
        
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

        // TEST DE ASIGNACIÓN DE PERMISOS
        // Creamos permisos de prueba
        $permiso1 = \App\Models\Permiso::create([
            'nombre' => 'Crear Usuario',
            'descripcion' => 'Permiso de prueba para crear usuario',
            'opcion_menu_id' => 1, // Dashboard u otro existente
            'created_by' => $user->id,
        ]);

        $permiso2 = \App\Models\Permiso::create([
            'nombre' => 'Ver Reportes',
            'descripcion' => 'Permiso de prueba para ver reportes',
            'opcion_menu_id' => 1,
            'created_by' => $user->id,
        ]);

        // Asignamos los permisos SOLO al Admin
        $adminRole->permisos()->sync([$permiso1->id, $permiso2->id]);

        // Verificamos en consola (esto saldrá al correr php artisan db:seed)
        $adminPermisosCount = $adminRole->permisos()->count();
        $operadorPermisosCount = $operadorRole->permisos()->count();

        echo "--- RESULTADO DEL TEST DE PERMISOS ---\n";
        echo "Permisos de Admin (Deberían ser 2): " . $adminPermisosCount . "\n";
        echo "Permisos de Operador (Deberían ser 0): " . $operadorPermisosCount . "\n";
        echo "--------------------------------------\n";
    }
}
