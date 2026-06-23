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
        $user = User::where('email', 'test@example.com')->firstOrFail();

        // Dashboard
        OpcionMenu::create([
            'nombre' => 'Dashboard',
            'ruta' => '#/',
            'icono' => 'bi bi-grid-fill',
            'created_by' => $user->id ?? 1,
        ]);

        // Incidencias
        $incidencias = OpcionMenu::create([
            'nombre' => 'Incidencias',
            'ruta' => '#/incidencias',
            'icono' => 'bi bi-ticket-detailed-fill',
            'created_by' => $user->id ?? 1,
        ]);

        // Submenus para incidencas

        // sub: registrar
        OpcionMenu::create([
            'nombre' => 'Registrar incidencia',
            'ruta' => '#/incidencias/registrar',
            'icono' => 'bi bi-ticket-detailed-fill',
            'padre_id' => $incidencias->id,
            'created_by' => $user->id ?? 1,
        ]);

        // sub: Gestion de incidencias
        OpcionMenu::create([
            'nombre' => 'Gestion de incidencias',
            'ruta' => '#/incidencias/gestion',
            'icono' => 'bi bi-ticket-detailed-fill',
            'padre_id' => $incidencias->id,
            'created_by' => $user->id ?? 1,
        ]);

        //sub: asignaciones
        OpcionMenu::create([
            'nombre' => 'Asignaciones',
            'ruta' => '#/incidencias/asignaciones',
            'icono' => 'bi bi-ticket-per-fill',
            'padre_id' => $incidencias->id,
            'created_by' => $user->id ?? 1,
        ]);

        //sub: mis incidencias
        OpcionMenu::create([
            'nombre' => 'Mis Incidencias',
            'ruta' => '#/incidencias/mis-incidencias',
            'icono' => 'bi bi-person-lines-fill',
            'padre_id' => $incidencias->id,
            'created_by' => $user->id ?? 1,
        ]);



        // Mapa de Incidencias
        OpcionMenu::create([
            'nombre' => 'Mapa de Incidencias',
            'ruta' => '#/mapa',
            'icono' => 'bi bi-geo-alt-fill',
            'created_by' => $user->id ?? 1,
        ]);

        // Consultas y reportes
        //sub: consultas
        OpcionMenu::create([
            'nombre' => 'Consultas',
            'ruta' => '#/consultas',
            'icono' => 'bi bi-search',
            'created_by' => $user->id ?? 1,
        ]);

        //sub: reports
        OpcionMenu::create([
            'nombre' => 'Reportes',
            'ruta' => '#/reportes',
            'icono' => 'bi bi-bar-chart-fill',
            'created_by' => $user->id ?? 1,
        ]);

        // Administracion (Padre)
        $config = OpcionMenu::create([
            'nombre' => 'Administración',
            'ruta' => '#/config',
            'icono' => 'bi bi-person-gear',
            'created_by' => $user->id ?? 1,
        ]);

        // Submenús de Administracion
        OpcionMenu::create([
            'nombre' => 'Usuarios',
            'ruta' => '#/administracion/usuarios',
            'icono' => 'bi bi-people-fill',
            'padre_id' => $config->id,
            'created_by' => $user->id ?? 1,
        ]);

        OpcionMenu::create([
            'nombre' => 'Roles y Permisos',
            'ruta' => '#/administracion/roles',
            'icono' => 'bi bi-shield-lock-fill',
            'padre_id' => $config->id,
            'created_by' => $user->id ?? 1,
        ]);

        OpcionMenu::create([
            'nombre' => 'Tipos de Incidencia',
            'ruta' => '#/administracion/tipos-incidencia',
            'icono' => 'bi bi-tags-fill',
            'padre_id' => $config->id,
            'created_by' => $user->id ?? 1,
        ]);

        OpcionMenu::create([
            'nombre' => 'Ubicaciones',
            'ruta' => '#/administracion/ubicaciones',
            'icono' => 'bi bi-geo-fill',
            'padre_id' => $config->id,
            'created_by' => $user->id ?? 1,
        ]);

        OpcionMenu::create([
            'nombre' => 'Opciones de Menú',
            'ruta' => '#/administracion/opciones-menu',
            'icono' => 'bi bi-menu-button-wide-fill',
            'padre_id' => $config->id,
            'created_by' => $user->id ?? 1,
        ]);

        OpcionMenu::create([
            'nombre' => 'Estados de Incidencia',
            'ruta' => '#/administracion/estados-incidencia',
            'icono' => 'bi bi-check2-circle',
            'padre_id' => $config->id,
            'created_by' => $user->id ?? 1,
        ]);

        OpcionMenu::create([
            'nombre' => 'Prioridades',
            'ruta' => '#/administracion/prioridades',
            'icono' => 'bi bi-exclamation-square',
            'padre_id' => $config->id,
            'created_by' => $user->id ?? 1,
        ]);

        OpcionMenu::create([
            'nombre' => 'Subtipos de Incidencia',
            'ruta' => '#/administracion/subtipos-incidencia',
            'icono' => 'bi bi-diagram-2',
            'padre_id' => $config->id,
            'created_by' => $user->id ?? 1,
        ]);

        OpcionMenu::create([
            'nombre' => 'Instituciones',
            'ruta' => '#/administracion/instituciones',
            'icono' => 'bi bi-building',
            'padre_id' => $config->id,
            'created_by' => $user->id ?? 1,
        ]);

        OpcionMenu::create([
            'nombre' => 'Auditoría',
            'ruta' => '#/administracion/auditoria',
            'icono' => 'bi bi-journal-text',
            'padre_id' => $config->id,
            'created_by' => $user->id ?? 1,
        ]);
    }
}
