<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\OpcionMenu;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

         // Seed menu options
        OpcionMenu::create([
            'nombre' => 'Dashboard',
            'ruta' => '#/',
            'icono' => 'bi bi-grid-fill',
            'created_by' => $user->id,
        ]);

        OpcionMenu::create([
            'nombre' => 'Opciones de Menú',
            'ruta' => '#/opciones-menu',
            'icono' => 'bi bi-menu-button-wide-fill',
            'created_by' => $user->id,
        ]);

        $config = OpcionMenu::create([
            'nombre' => 'Configuración',
            'ruta' => '#/config',
            'icono' => 'bi bi-gear-fill',
            'created_by' => $user->id,
        ]);

        OpcionMenu::create([
            'nombre' => 'Usuarios',
            'ruta' => '#/config/usuarios',
            'icono' => 'bi bi-people-fill',
            'padre_id' => $config->id,
            'created_by' => $user->id,
        ]);
    }
}
