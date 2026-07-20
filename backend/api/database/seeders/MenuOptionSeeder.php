<?php

namespace Database\Seeders;

use App\Models\OpcionMenu;
use App\Models\User;
use Illuminate\Database\Seeder;

class MenuOptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();

        if (! $user) {
            return;
        }

        OpcionMenu::updateOrCreate(
            ['ruta' => '#/'],
            [
                'nombre' => 'Dashboard',
                'icono' => 'bi bi-grid-fill',
                'padre_id' => null,
                'created_by' => $user->id,
            ]
        );

        $incidencia = OpcionMenu::updateOrCreate(
            ['ruta' => '#/incidencias'],
            [
                'nombre' => 'Incidencias',
                'icono' => 'bi bi-exclamation-triangle-fill',
                'padre_id' => null,
                'created_by' => $user->id,
            ]
        );

        OpcionMenu::updateOrCreate(
            ['ruta' => '#/incidencias/form'],
            [
                'nombre' => 'Registro',
                'icono' => 'bi bi-pencil-square',
                'padre_id' => $incidencia->id,
                'created_by' => $user->id,
            ]
        );

        OpcionMenu::updateOrCreate(
            ['ruta' => '#/incidencias/despacho'],
            [
                'nombre' => 'Despacho',
                'icono' => 'bi bi-send-check-fill',
                'padre_id' => $incidencia->id,
                'created_by' => $user->id,
            ]
        );

        $tramites = OpcionMenu::updateOrCreate(
            ['ruta' => '#/tramites'],
            [
                'nombre' => 'Trámites',
                'icono' => 'bi bi-search',
                'padre_id' => null,
                'created_by' => $user->id,
            ]
        );

        OpcionMenu::updateOrCreate(
            ['ruta' => '#/tramites/historial'],
            [
                'nombre' => 'Historial de incidencias',
                'icono' => 'bi bi-clock-history',
                'padre_id' => $tramites->id,
                'created_by' => $user->id,
            ]
        );

        OpcionMenu::updateOrCreate(
            ['ruta' => '#/instituciones/kanban'],
            [
                'nombre' => 'Tablero Kanban',
                'icono' => 'bi bi-kanban-fill',
                'padre_id' => null,
                'created_by' => $user->id,
            ]
        );

        $mantenimiento = OpcionMenu::updateOrCreate(
            ['ruta' => '#/mantenimiento'],
            [
                'nombre' => 'Mantenimiento',
                'icono' => 'bi bi-gear-fill',
                'padre_id' => null,
                'created_by' => $user->id,
            ]
        );

        OpcionMenu::updateOrCreate(
            ['ruta' => '#/opciones-menu'],
            [
                'nombre' => 'Opciones de Menú',
                'icono' => 'bi bi-menu-button-wide-fill',
                'padre_id' => $mantenimiento->id,
                'created_by' => $user->id,
            ]
        );

        OpcionMenu::updateOrCreate(
            ['ruta' => '#/ubicaciones'],
            [
                'nombre' => 'Ubicaciones',
                'icono' => 'bi bi-geo-alt-fill',
                'padre_id' => $mantenimiento->id,
                'created_by' => $user->id,
            ]
        );

        OpcionMenu::updateOrCreate(
            ['ruta' => '#/instituciones'],
            [
                'nombre' => 'Instituciones',
                'icono' => 'bi bi-building-fill',
                'padre_id' => $mantenimiento->id,
                'created_by' => $user->id,
            ]
        );

        OpcionMenu::updateOrCreate(
            ['ruta' => '#/categorias'],
            [
                'nombre' => 'Categorías de Incidencias',
                'icono' => 'bi bi-tags-fill',
                'padre_id' => $mantenimiento->id,
                'created_by' => $user->id,
            ]
        );

        $administracion = OpcionMenu::updateOrCreate(
            ['ruta' => '#/administracion'],
            [
                'nombre' => 'Administración',
                'icono' => 'bi bi-shield-lock-fill',
                'padre_id' => null,
                'created_by' => $user->id,
            ]
        );

        OpcionMenu::updateOrCreate(
            ['ruta' => '#/roles'],
            [
                'nombre' => 'Roles',
                'icono' => 'bi bi-shield-lock-fill',
                'padre_id' => $administracion->id,
                'created_by' => $user->id,
            ]
        );

        OpcionMenu::updateOrCreate(
            ['ruta' => '#/permisos'],
            [
                'nombre' => 'Permisos',
                'icono' => 'bi bi-key-fill',
                'padre_id' => $administracion->id,
                'created_by' => $user->id,
            ]
        );

        OpcionMenu::updateOrCreate(
            ['ruta' => '#/usuarios'],
            [
                'nombre' => 'Usuarios',
                'icono' => 'bi bi-people-fill',
                'padre_id' => $administracion->id,
                'created_by' => $user->id,
            ]
        );

        OpcionMenu::updateOrCreate(
            ['ruta' => '#/trp-dashboard'],
            [
                'nombre' => 'TRP',
                'icono' => 'bi bi-graph-up',
                'padre_id' => $administracion->id,
                'created_by' => $user->id,
            ]
        );
    }
}
