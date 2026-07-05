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
            'Ubicaciones' => 'Ubicación',
            'Categorías de Incidencias' => 'Categoría de Incidencia',
            'Incidencias' => 'Incidencia',
            'Instituciones' => 'Institución',
            'Despacho de Incidencias' => 'Despacho de Incidencia',
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
            'Ubicaciones' => 'ubicaciones',
            'Categorías de Incidencias' => 'categorias_incidencia',
            'Incidencias' => 'incidencias',
            'Instituciones' => 'instituciones',
            'Despacho de Incidencias' => 'despacho_de_incidencias',
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

        // Seed locations sub-resources permissions under the Ubicaciones menu option
        $ubicacionesMenu = OpcionMenu::where('nombre', 'Ubicaciones')->first();
        if ($ubicacionesMenu) {
            $subRecursos = [
                'paises' => 'País',
                'territorios' => 'Territorio',
                'direcciones' => 'Dirección',
            ];
            foreach ($subRecursos as $recursoSub => $nombreSingular) {
                foreach ($acciones as $verbo => $metodo) {
                    Permiso::create([
                        'nombre' => "{$verbo} {$nombreSingular}",
                        'accion' => $metodo,
                        'recurso' => $recursoSub,
                        'opcion_menu_id' => $ubicacionesMenu->id,
                        'created_by' => $user->id,
                    ]);
                }
            }
        }
    }
}
