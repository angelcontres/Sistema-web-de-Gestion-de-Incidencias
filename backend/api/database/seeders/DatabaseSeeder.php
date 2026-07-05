<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Services\Contracts\RoleServiceInterface;
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
            'username' => 'Admin Administrador',
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'activo' => true,
        ]);

        // Seed menu options
        $this->call(MenuOptionSeeder::class);
        $this->call(PermissionsSeeder::class);

        $this->call(RoleSeeder::class);

        // Seed catalogs
        $this->call(PrioridadSeeder::class);
        $this->call(EstadoIncidenciaSeeder::class);
        $this->call(UbicacionesSeeder::class);
        $this->call(InstitucionesSeeder::class);
        $this->call(ClasificacionesSeeder::class);

        $roleService = app(RoleServiceInterface::class);

        // Assign the Admin role to the test user
        $adminRole = Role::where('nombre', 'Admin')->first();
        if ($adminRole) {
            $roleService->syncRolesToUser($user, [$adminRole->id]);
        }

        // Create Operator users for each country
        $operatorsData = [
            [
                'name' => 'Operador Chile',
                'username' => 'operador_chile',
                'email' => 'operador.chile@example.com',
                'pais_id' => 1,
            ],
            [
                'name' => 'Operador Colombia',
                'username' => 'operador_colombia',
                'email' => 'operador.colombia@example.com',
                'pais_id' => 2,
            ],
            [
                'name' => 'Operador Ecuador',
                'username' => 'operador_ecuador',
                'email' => 'operador.ecuador@example.com',
                'pais_id' => 3,
            ],
        ];

        $operatorRole = Role::where('nombre', 'Operador')->first();

        foreach ($operatorsData as $data) {
            $opUser = User::create([
                'name' => $data['name'],
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => Hash::make('password123'),
                'activo' => true,
                'pais_id' => $data['pais_id'],
            ]);

            if ($operatorRole) {
                $roleService->syncRolesToUser($opUser, [$operatorRole->id]);
            }
        }

        // Create specific test users for remaining core scenarios:
        // 1. ciudadano@example.com (Ciudadano)
        $ciudadanoUser = User::create([
            'name' => 'Ciudadano Prueba',
            'username' => 'ciudadano_prueba',
            'email' => 'ciudadano@example.com',
            'password' => Hash::make('password123'),
            'activo' => true,
        ]);
        $ciudadanoRole = Role::where('nombre', 'Ciudadano')->first();
        if ($ciudadanoRole) {
            $roleService->syncRolesToUser($ciudadanoUser, [$ciudadanoRole->id]);
        }

        // 2. institucion@example.com (Institucion, linked to PNE / id 1)
        $institucionUser = User::create([
            'name' => 'Policia Nacional (Prueba)',
            'username' => 'policia_prueba',
            'email' => 'institucion@example.com',
            'password' => Hash::make('password123'),
            'activo' => true,
            'institucion_id' => 1, // Policía Nacional del Ecuador
        ]);
        $institucionRole = Role::where('nombre', 'Institucion')->first();
        if ($institucionRole) {
            $roleService->syncRolesToUser($institucionUser, [$institucionRole->id]);
        }

        // 3. supervisor@example.com (Operador, as this role represents the supervisor)
        $supervisorUser = User::create([
            'name' => 'Supervisor General',
            'username' => 'supervisor_general',
            'email' => 'supervisor@example.com',
            'password' => Hash::make('password123'),
            'activo' => true,
            'pais_id' => 3, // Ecuador (since they supervise EC)
        ]);
        if ($operatorRole) {
            $roleService->syncRolesToUser($supervisorUser, [$operatorRole->id]);
        }
    }
}
