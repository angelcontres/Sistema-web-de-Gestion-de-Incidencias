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
            'Progreso' => 'Kanban',
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
            'Opciones de Menú' => 'opciones',
            'TRP' => 'trp',
            'Ubicaciones' => 'ubicaciones',
            'Categorías de Incidencias' => 'categorias',
            'Incidencias' => 'incidencias',
            'Instituciones' => 'instituciones',
            'Despacho' => 'despacho',
            'Progreso' => 'kanban',
            'Historial de incidencias' => 'historial',
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
            'prioridades' => 'Prioridad',
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
