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

        OpcionMenu::create([
            'nombre' => 'Dashboard',
            'ruta' => '#/',
            'icono' => 'bi bi-grid-fill',
            'padre_id' => null,
            'created_by' => $user->id,
        ]);

        $config = OpcionMenu::create([
            'nombre' => 'Configuración',
            'ruta' => '#',
            'icono' => 'bi bi-gear-fill',
            'padre_id' => null,
            'created_by' => $user->id,
        ]);

        OpcionMenu::create([
            'nombre' => 'Opciones de Menú',
            'ruta' => '#/opciones-menu',
            'icono' => 'bi bi-menu-button-wide-fill',
            'padre_id' => $config->id,
            'created_by' => $user->id,
        ]);

        OpcionMenu::create([
            'nombre' => 'Roles',
            'ruta' => '#/roles',
            'icono' => 'bi bi-shield-lock-fill',
            'padre_id' => $config->id,
            'created_by' => $user->id,
        ]);

        OpcionMenu::create([
            'nombre' => 'Permisos',
            'ruta' => '#/permisos',
            'icono' => 'bi bi-key-fill',
            'padre_id' => $config->id,
            'created_by' => $user->id,
        ]);

        OpcionMenu::create([
            'nombre' => 'Usuarios',
            'ruta' => '#/usuarios',
            'icono' => 'bi bi-people-fill',
            'padre_id' => $config->id,
            'created_by' => $user->id,
        ]);

        OpcionMenu::create([
            'nombre' => 'SQA',
            'ruta' => '#/sqa-dashboard',
            'icono' => 'bi bi-graph-up',
            'padre_id' => null,
            'created_by' => $user->id,
        ]);

        OpcionMenu::create([
            'nombre' => 'Ubicaciones',
            'ruta' => '#/ubicaciones',
            'icono' => 'bi bi-geo-alt-fill',
            'padre_id' => $config->id,
            'created_by' => $user->id,
        ]);

        OpcionMenu::create([
            'nombre' => 'Instituciones',
            'ruta' => '#/instituciones',
            'icono' => 'bi bi-building-fill',
            'padre_id' => $config->id,
            'created_by' => $user->id,
        ]);

        OpcionMenu::create([
            'nombre' => 'Categorías de Incidencias',
            'ruta' => '#/categorias',
            'icono' => 'bi bi-tags-fill',
            'padre_id' => $config->id,
            'created_by' => $user->id,
        ]);

        $incidencia = OpcionMenu::create([
            'nombre' => 'Incidencias',
            'ruta' => '#/incidencias',
            'icono' => 'bi bi-exclamation-triangle-fill',
            'padre_id' => null,
            'created_by' => $user->id,
        ]);

        OpcionMenu::create([
            'nombre' => 'Registro',
            'ruta' => '#/incidencias/registro',
            'icono' => 'bi bi-pencil-square',
            'padre_id' => $incidencia->id,
            'created_by' => $user->id,
        ]);

        OpcionMenu::create([
            'nombre' => 'Despacho',
            'ruta' => '#/incidencias/despacho',
            'icono' => 'bi bi-send-check-fill',
            'padre_id' => $incidencia->id,
            'created_by' => $user->id,
        ]);
    }
}
