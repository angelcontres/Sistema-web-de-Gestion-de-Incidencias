<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Services\Contracts\RoleServiceInterface;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Asegurarse de que el esquema OLAP se reconstruya siempre en un entorno fresh
        if (config('database.default') !== 'sqlite') {
            Artisan::call('migrate', [
                '--path' => 'database/migrations/olap',
                '--force' => true,
            ]);
        }

        // User::factory(10)->create();

        $user = User::where('email', 'test@example.com')->first();
        if (! $user) {
            $user = User::factory()->create([
                'name' => 'Test User',
                'username' => 'Admin Administrador',
                'email' => 'test@example.com',
                'password' => Hash::make('password123'),
                'activo' => true,
            ]);
        }

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
        $this->call(SupervisoresTerritorialesSeeder::class);

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
            $opUser = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'username' => $data['username'],
                    'password' => Hash::make('password123'),
                    'activo' => true,
                    'pais_id' => $data['pais_id'],
                ]
            );

            if ($supervisorRole) {
                $roleService->syncRolesToUser($opUser, [$supervisorRole->id]);
            }
        }

        // Create specific test users for remaining core scenarios:
        // 1. ciudadano@example.com (Ciudadano)
        $ciudadanoUser = User::updateOrCreate(
            ['email' => 'ciudadano@example.com'],
            [
                'name' => 'Ciudadano Prueba',
                'username' => 'ciudadano_prueba',
                'password' => Hash::make('password123'),
                'activo' => true,
            ]
        );
        $ciudadanoRole = Role::where('nombre', 'Ciudadano')->first();
        if ($ciudadanoRole) {
            $roleService->syncRolesToUser($ciudadanoUser, [$ciudadanoRole->id]);
        }

        // Crear usuario llamado Carlos Patiño
        $carlosUser = User::updateOrCreate(
            ['email' => 'carlos@example.com'],
            [
                'name' => 'Carlos Patiño',
                'username' => 'carlospatino1',
                'password' => Hash::make('carlos123'),
                'activo' => true,
            ]
        );
        $carlosUserRole = Role::where('nombre', 'Ciudadano')->first();
        if ($carlosUserRole) {
            $roleService->syncRolesToUser($carlosUser, [$carlosUserRole->id]);
        }

        // Crear usuario llamado Angel Villón
        $angelUser = User::updateOrCreate(
            ['email' => 'angel@example.com'],
            [
                'name' => 'Angel Villón',
                'username' => 'angelvillon1',
                'password' => Hash::make('angel123'),
                'activo' => true,
            ]
        );
        $angelUserRole = Role::where('nombre', 'Ciudadano')->first();
        if ($angelUserRole) {
            $roleService->syncRolesToUser($angelUser, [$angelUserRole->id]);
        }

        // Crear usuario llamado Paulo Orrala
        $pauloUser = User::updateOrCreate(
            ['email' => 'paulo@example.com'],
            [
                'name' => 'Paulo Orrala',
                'username' => 'pauloorrala1',
                'password' => Hash::make('paulo123'),
                'activo' => true,
            ]
        );
        $pauloUserRole = Role::where('nombre', 'Ciudadano')->first();
        if ($pauloUserRole) {
            $roleService->syncRolesToUser($pauloUser, [$pauloUserRole->id]);
        }

        // Crear usuario llamado Evelyn del Pezo
        $evelynUser = User::updateOrCreate(
            ['email' => 'evelyn@example.com'],
            [
                'name' => 'Evelyn del Pezo',
                'username' => 'evelyndelpezo1',
                'password' => Hash::make('evelyn123'),
                'activo' => true,
            ]
        );
        $evelynUserRole = Role::where('nombre', 'Ciudadano')->first();
        if ($evelynUserRole) {
            $roleService->syncRolesToUser($evelynUser, [$evelynUserRole->id]);
        }

        // 2. institucion@example.com (Institucion, linked to PNE / id 1)
        $institucionUser = User::updateOrCreate(
            ['email' => 'policianacional@example.com'],
            [
                'name' => 'Policia Nacional del Ecuador',
                'username' => 'policia_prueba',
                'password' => Hash::make('policianacional123'),
                'activo' => true,
                'institucion_id' => \App\Models\Institucion::where('siglas', 'PNE')->value('id'),
            ]
        );
        $institucionRole = Role::where('nombre', 'Institucion')->first();
        if ($institucionRole) {
            $roleService->syncRolesToUser($institucionUser, [$institucionRole->id]);
        }

        // EPMMOP / id 2
        $epmmopUser = User::updateOrCreate(
            ['email' => 'epmmop@example.com'],
            [
                'name' => 'Empresa Pública Metropolitana de Movilidad y Obras Públicas',
                'username' => 'epmmop_user',
                'password' => Hash::make('epmmop123'),
                'activo' => true,
                'institucion_id' => \App\Models\Institucion::where('siglas', 'EPMMOP')->value('id'),
            ]
        );
        if ($institucionRole) {
            $roleService->syncRolesToUser($epmmopUser, [$institucionRole->id]);
        }

        // EEQ / id 3
        $eeqUser = User::updateOrCreate(
            ['email' => 'eeq@example.com'],
            [
                'name' => 'Empresa Eléctrica de Quito',
                'username' => 'eeq_user',
                'password' => Hash::make('eeq123'),
                'activo' => true,
                'institucion_id' => \App\Models\Institucion::where('siglas', 'EEQ')->value('id'),
            ]
        );
        if ($institucionRole) {
            $roleService->syncRolesToUser($eeqUser, [$institucionRole->id]);
        }

        // EPMAPS / id 4
        $epmapsUser = User::updateOrCreate(
            ['email' => 'epmaps@example.com'],
            [
                'name' => 'Empresa Pública Metropolitana de Agua Potable y Saneamiento',
                'username' => 'epmaps_user',
                'password' => Hash::make('epmaps123'),
                'activo' => true,
                'institucion_id' => \App\Models\Institucion::where('siglas', 'EPMAPS')->value('id'),
            ]
        );
        if ($institucionRole) {
            $roleService->syncRolesToUser($epmapsUser, [$institucionRole->id]);
        }

        // EMGIRS / id 5
        $emgirsUser = User::updateOrCreate(
            ['email' => 'emgirs@example.com'],
            [
                'name' => 'Empresa Pública de Gestión Integral de Residuos',
                'username' => 'emgirs_user',
                'password' => Hash::make('emgirs123'),
                'activo' => true,
                'institucion_id' => \App\Models\Institucion::where('siglas', 'EMGIRS')->value('id'),
            ]
        );
        if ($institucionRole) {
            $roleService->syncRolesToUser($emgirsUser, [$institucionRole->id]);
        }

        // DMA / id 6
        $dmaUser = User::updateOrCreate(
            ['email' => 'dma@example.com'],
            [
                'name' => 'Dirección de Medio Ambiente Municipal',
                'username' => 'dmamunicipal_user',
                'password' => Hash::make('dmamunicipal123'),
                'activo' => true,
                'institucion_id' => \App\Models\Institucion::where('siglas', 'DMA')->value('id'),
            ]
        );
        if ($institucionRole) {
            $roleService->syncRolesToUser($dmaUser, [$institucionRole->id]);
        }

        // CTE / id 7
        $cteUser = User::updateOrCreate(
            ['email' => 'comisiontransito@example.com'],
            [
                'name' => 'Comisión de tránsito del Ecuador',
                'username' => 'comisiontransito_user',
                'password' => Hash::make('comisiontransito123'),
                'activo' => true,
                'institucion_id' => \App\Models\Institucion::where('siglas', 'CTE')->value('id'),
            ]
        );
        if ($institucionRole) {
            $roleService->syncRolesToUser($cteUser, [$institucionRole->id]);
        }

        // 3. supervisor@example.com (Supervisor)
        $supervisorUser = User::updateOrCreate(
            ['email' => 'supervisor@example.com'],
            [
                'name' => 'Supervisor General',
                'username' => 'supervisor_general',
                'password' => Hash::make('password123'),
                'activo' => true,
                'pais_id' => 3, // Ecuador
            ]
        );
        if ($supervisorRole) {
            $roleService->syncRolesToUser($supervisorUser, [$supervisorRole->id]);
        }

        $this->call(NotificationSeeder::class);

        // Ejecutar ETL inicial para asegurar que las dimensiones del Data Warehouse estén pobladas
        if (config('database.default') !== 'sqlite') {
            Artisan::call('etl:run');
        }

    }
}
