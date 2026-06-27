<?php

namespace Database\Seeders;

use App\Models\OpcionMenu;
use App\Models\Permiso;
use App\Models\User;
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
            'Opciones de Menú' => 'Opción de Menú',
            'SQA' => 'SQA',
        ];

        $acciones = [
            'Ver' => 'READ',
            'Crear' => 'CREATE',
            'Actualizar' => 'UPDATE',
            'Eliminar' => 'DELETE',
        ];

        $recursoMapping = [
            'Usuarios' => 'usuarios',
            'Roles' => 'roles',
            'Permisos' => 'permisos',
            'Opciones de Menú' => 'opciones_menu',
            'SQA' => 'sqa',
        ];

        foreach ($opciones as $opcionPlural => $opcionSingular) {
            $opcionMenu = OpcionMenu::where('nombre', $opcionPlural)->first();

            $recursoStr = $recursoMapping[$opcionPlural] ?? strtolower(str_replace(' ', '_', $opcionPlural));

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
