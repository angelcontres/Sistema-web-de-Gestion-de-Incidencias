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

        // Create Supervisor users for each country
        $supervisorsData = [
            [
                'name' => 'Supervisor Chile',
                'username' => 'supervisor_chile',
                'email' => 'supervisor.chile@example.com',
                'pais_id' => 1,
            ],
            [
                'name' => 'Supervisor Colombia',
                'username' => 'supervisor_colombia',
                'email' => 'supervisor.colombia@example.com',
                'pais_id' => 2,
            ],
            [
                'name' => 'Supervisor Ecuador',
                'username' => 'supervisor_ecuador',
                'email' => 'supervisor.ecuador@example.com',
                'pais_id' => 3,
            ],
        ];

        $supervisorRole = Role::where('nombre', 'Supervisor')->first();

        foreach ($supervisorsData as $data) {
            $opUser = User::create([
                'name' => $data['name'],
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => Hash::make('password123'),
                'activo' => true,
                'pais_id' => $data['pais_id'],
            ]);

            if ($supervisorRole) {
                $roleService->syncRolesToUser($opUser, [$supervisorRole->id]);
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

        // Crear usuario llamado Carlos Patiño
        $carlosUser = User::create([
            'name' => 'Carlos Patiño',
            'username' => 'carlospatino1',
            'email' => 'carlos@example.com',
            'password' => Hash::make('carlos123'),
            'activo' => true,
        ]);
        $carlosUserRole = Role::where('nombre', 'Ciudadano')->first();
        if ($carlosUserRole) {
            $roleService->syncRolesToUser($carlosUser, [$carlosUserRole->id]);
        }

        //Crear usuario llamado Angel Villón
        $angelUser = User::create([
            'name' => 'Angel Villón',
            'username' => 'angelvillon1',
            'email' => 'angel@example.com',
            'password' => Hash::make('angel123'),
            'activo' => true,
        ]);
        $angelUserRole = Role::where('nombre', 'Ciudadano')->first();
        if ($angelUserRole) {
            $roleService->syncRolesToUser($angelUser, [$angelUserRole->id]);
        }

        //Crear usuario llamado Paulo Orrala
        $pauloUser = User::create([
            'name' => 'Paulo Orrala',
            'username' => 'pauloorrala1',
            'email' => 'paulo@example.com',
            'password' => Hash::make('paulo123'),
            'activo' => true,
        ]);
        $pauloUserRole = Role::where('nombre', 'Ciudadano')->first();
        if ($pauloUserRole) {
            $roleService->syncRolesToUser($pauloUser, [$pauloUserRole->id]);
        }

        // 2. institucion@example.com (Institucion, linked to PNE / id 1)
        $institucionUser = User::create([
            'name' => 'Policia Nacional (Prueba)',
            'username' => 'policia_prueba',
            'email' => 'policianacional@example.com',
            'password' => Hash::make('policianacional123'),
            'activo' => true,
            'institucion_id' => 1, // Policía Nacional del Ecuador
        ]);
        $institucionRole = Role::where('nombre', 'Institucion')->first();
        if ($institucionRole) {
            $roleService->syncRolesToUser($institucionUser, [$institucionRole->id]);
        }

        // EPMMOP / id 2
        $epmmopUser = User::create([
            'name' => 'EPMMOP (Prueba)',
            'username' => 'epmmop_prueba',
            'email' => 'epmmop@example.com',
            'password' => Hash::make('epmmop123'),
            'activo' => true,
            'institucion_id' => 2,
        ]);
        if ($institucionRole) {
            $roleService->syncRolesToUser($epmmopUser, [$institucionRole->id]);
        }

        // EEQ / id 3
        $eeqUser = User::create([
            'name' => 'EEQ (Prueba)',
            'username' => 'eeq_prueba',
            'email' => 'eeq@example.com',
            'password' => Hash::make('eeq123'),
            'activo' => true,
            'institucion_id' => 3,
        ]);
        if ($institucionRole) {
            $roleService->syncRolesToUser($eeqUser, [$institucionRole->id]);
        }

        // EPMAPS / id 4
        $epmapsUser = User::create([
            'name' => 'EPMAPS (Prueba)',
            'username' => 'epmaps_prueba',
            'email' => 'epmaps@example.com',
            'password' => Hash::make('epmaps123'),
            'activo' => true,
            'institucion_id' => 4,
        ]);
        if ($institucionRole) {
            $roleService->syncRolesToUser($epmapsUser, [$institucionRole->id]);
        }

        // EMGIRS / id 5
        $emgirsUser = User::create([
            'name' => 'EMGIRS (Prueba)',
            'username' => 'emgirs_prueba',
            'email' => 'emgirs@example.com',
            'password' => Hash::make('emgirs123'),
            'activo' => true,
            'institucion_id' => 5,
        ]);
        if ($institucionRole) {
            $roleService->syncRolesToUser($emgirsUser, [$institucionRole->id]);
        }

        // DMA / id 6
        $dmaUser = User::create([
            'name' => 'DMA (Prueba)',
            'username' => 'dma_prueba',
            'email' => 'dma@example.com',
            'password' => Hash::make('dma123'),
            'activo' => true,
            'institucion_id' => 6,
        ]);
        if ($institucionRole) {
            $roleService->syncRolesToUser($dmaUser, [$institucionRole->id]);
        }

        // CTE / id 7
        $cteUser = User::create([
            'name' => 'CTE (Prueba)',
            'username' => 'cte_prueba',
            'email' => 'cte@example.com',
            'password' => Hash::make('cte123'),
            'activo' => true,
            'institucion_id' => 7,
        ]);
        if ($institucionRole) {
            $roleService->syncRolesToUser($cteUser, [$institucionRole->id]);
        }

        // 3. supervisor@example.com (Supervisor)
        $supervisorUser = User::create([
            'name' => 'Supervisor General',
            'username' => 'supervisor_general',
            'email' => 'supervisor@example.com',
            'password' => Hash::make('password123'),
            'activo' => true,
            'pais_id' => 3, // Ecuador (since they supervise EC)
        ]);
        if ($supervisorRole) {
            $roleService->syncRolesToUser($supervisorUser, [$supervisorRole->id]);
        }
    }
}
