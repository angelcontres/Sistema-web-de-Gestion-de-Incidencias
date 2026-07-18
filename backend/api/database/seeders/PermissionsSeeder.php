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
            'TRP' => 'TRP',
            'Ubicaciones' => 'Ubicación',
            'Categorías de Incidencias' => 'Categoría de Incidencia',
            'Incidencias' => 'Incidencia',
            'Instituciones' => 'Institución',
            'Despacho' => 'Despacho de Incidencia',
            'Tablero Kanban' => 'Kanban',
            'Historial de incidencias' => 'Historial',
            'Mantenimiento' => 'Mantenimiento',
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
            'TRP' => 'trp',
            'Ubicaciones' => 'ubicaciones',
            'Categorías de Incidencias' => 'categorias_incidencia',
            'Incidencias' => 'incidencias',
            'Instituciones' => 'instituciones',
            'Despacho' => 'despacho_de_incidencias',
            'Tablero Kanban' => 'kanban',
            'Historial de incidencias' => 'historial_incidencias',
            'Mantenimiento' => 'mantenimiento',
        ];

        foreach ($opciones as $opcionPlural => $opcionSingular) {
            $opcionMenu = OpcionMenu::where('nombre', $opcionPlural)->first();

            $recursoStr = $recursoMapping[$opcionPlural] ?? strtolower(str_replace(' ', '_', $opcionPlural));

            $opcionMenuId = $opcionMenu ? $opcionMenu->id : null;

            foreach ($acciones as $verbo => $metodo) {
                Permiso::updateOrCreate(
                    ['nombre' => "{$verbo} {$opcionSingular}"],
                    [
                        'accion' => $metodo,
                        'recurso' => $recursoStr,
                        'opcion_menu_id' => $opcionMenuId,
                        'created_by' => $user->id,
                    ]
                );
            }
        }

        // Seed locations sub-resources permissions under the Ubicaciones menu option
        $subRecursos = [
            'paises' => 'País',
            'territorios' => 'Territorio',
            'direcciones' => 'Dirección',
        ];
        foreach ($subRecursos as $recursoSub => $nombreSingular) {
            foreach ($acciones as $verbo => $metodo) {
                Permiso::updateOrCreate(
                    ['nombre' => "{$verbo} {$nombreSingular}"],
                    [
                        'accion' => $metodo,
                        'recurso' => $recursoSub,
                        'opcion_menu_id' => null,
                        'created_by' => $user->id,
                    ]
                );
            }
        }

        // Adjust menu option bindings for Incidencias permissions
        $registroMenu = OpcionMenu::where('nombre', 'Registro')->first();
        if ($registroMenu) {
            Permiso::where('nombre', 'Crear Incidencia')->update([
                'opcion_menu_id' => $registroMenu->id,
            ]);
        }
    }
}
