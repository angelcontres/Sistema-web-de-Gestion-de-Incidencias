<?php

namespace Database\Seeders;

use \App\Models\User;
use \App\Models\OpcionMenu;
use \App\Models\Permiso;
use Illuminate\Database\Seeder;

class PermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();

        $opciones = [
            'Dashboard' => 'Dashboard',
            'Usuarios' => 'Usuario',
            'Roles' => 'Rol',
            'Permisos' => 'Permiso',
            'Opciones Menu' => 'Opcion menu'
        ];

        $acciones = [
            'Ver' => 'READ',
            'Crear' => 'CREATE',
            'Actualizar' => 'UPDATE',
            'Eliminar' => 'DELETE'
        ];

        foreach ($opciones as $opcionPlural => $opcionSingular) {
            $opcionMenu = OpcionMenu::where('nombre', $opcionPlural)->first();

            // The resource string is directly the plural form now
            $recursoStr = $opcionPlural;

            if ($opcionMenu) {
                foreach ($acciones as $verbo => $metodo) {
                    Permiso::create([
                        'nombre' => "{$verbo} {$opcionSingular}",
                        'accion' => $metodo,
                        'recurso' => $recursoStr,
                        'opcion_menu_id' => $opcionMenu->id,
                        'created_by' => $user->id,
                    ]);
                }
            }
        }
    }
}
