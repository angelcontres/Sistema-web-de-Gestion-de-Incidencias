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
            'Usuarios' => 'Usuario',
            'Roles' => 'Rol',
            'Permisos' => 'Permiso',
            'Opciones de Menú' => 'Opción de Menú'
        ];

        $acciones = [
            'Ver' => 'READ',
            'Crear' => 'CREATE',
            'Actualizar' => 'UPDATE',
            'Eliminar' => 'DELETE'
        ];

        foreach ($opciones as $opcionPlural => $opcionSingular) {
            $opcionMenu = OpcionMenu::where('nombre', $opcionPlural)->first();

            if ($opcionMenu) {
                foreach ($acciones as $verbo => $metodo) {
                    Permiso::create([
                        'nombre' => "{$verbo} {$opcionSingular}",
                        'descripcion' => "Permite la acción {$metodo} en el módulo de {$opcionPlural}",
                        'opcion_menu_id' => $opcionMenu->id,
                        'created_by' => $user->id,
                    ]);
                }
            }
        }
    }
}
