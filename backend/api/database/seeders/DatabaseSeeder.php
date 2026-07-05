<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
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

        // Assign the Admin role to the test user
        $adminRole = Role::where('nombre', 'Admin')->first();
        if ($adminRole) {
            $user->roles()->sync([$adminRole->id]);
        }

        // Create Operator users for each country
        $operatorsData = [
            [
                'name' => 'Operador Perú',
                'username' => 'Operador PE',
                'email' => 'operator.pe@example.com',
                'pais_id' => 1, // Perú
            ],
            [
                'name' => 'Operador México',
                'username' => 'Operador MX',
                'email' => 'operator.mx@example.com',
                'pais_id' => 2, // México
            ],
            [
                'name' => 'Operador Ecuador',
                'username' => 'Operador EC',
                'email' => 'operator.ec@example.com',
                'pais_id' => 3, // Ecuador
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
                $opUser->roles()->sync([$operatorRole->id]);
            }
        }

        // Seed specific profiles requested by user:
        // 1. ciudadano@example.com (Ciudadano)
        $ciudadanoUser = User::create([
            'name' => 'Ciudadano de Prueba',
            'username' => 'ciudadano',
            'email' => 'ciudadano@example.com',
            'password' => Hash::make('password123'),
            'activo' => true,
        ]);
        $ciudadanoRole = Role::where('nombre', 'Ciudadano')->first();
        if ($ciudadanoRole) {
            $ciudadanoUser->roles()->sync([$ciudadanoRole->id]);
        }

        // 2. institucion@example.com (Institucion, linked to PNE / id 1)
        $institucionUser = User::create([
            'name' => 'Institución de Prueba',
            'username' => 'institucion',
            'email' => 'institucion@example.com',
            'password' => Hash::make('password123'),
            'activo' => true,
            'institucion_id' => 1, // Policía Nacional del Ecuador
        ]);
        $institucionRole = Role::where('nombre', 'Institucion')->first();
        if ($institucionRole) {
            $institucionUser->roles()->sync([$institucionRole->id]);
        }

        // 3. supervisor@example.com (Operador, as this role represents the supervisor)
        $supervisorUser = User::create([
            'name' => 'Supervisor de Prueba',
            'username' => 'supervisor',
            'email' => 'supervisor@example.com',
            'password' => Hash::make('password123'),
            'activo' => true,
            'pais_id' => 3, // Ecuador (since they supervise EC)
        ]);
        if ($operatorRole) {
            $supervisorUser->roles()->sync([$operatorRole->id]);
        }
    }
}
