<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Territorio;
use App\Models\User;
use App\Services\Contracts\RoleServiceInterface;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SupervisoresTerritorialesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roleService = app(RoleServiceInterface::class);
        $supervisorRole = Role::where('nombre', 'Supervisor')->first();

        if (!$supervisorRole) {
            return;
        }

        // Definimos los supervisores y las provincias (nombres) que supervisan
        $supervisores = [
            [
                'name' => 'Supervisor Sierra',
                'username' => 'supervisor_sierra',
                'email' => 'sierra@example.com',
                'password' => 'sierra123',
                'provincias' => [
                    'Azuay', 'Bolivar', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo',
                    'Cotopaxi', 'Imbabura', 'Loja', 'Pichincha', 'Tungurahua'
                ]
            ],
            [
                'name' => 'Supervisor Costa',
                'username' => 'supervisor_costa',
                'email' => 'costa@example.com',
                'password' => 'costa123',
                'provincias' => [
                    'Guayas', 'Manabi', 'Manabí', 'Esmeraldas', 'El Oro', 'Los Rios', 'Los Ríos',
                    'Santa Elena', 'Santo Domingo De Los Tsachilas', 'Santo Domingo De Los Tsáchilas',
                    'Santo Domingo de los Tsáchilas', 'Santo Domingo de los Tsachilas'
                ]
            ],
            [
                'name' => 'Supervisor Amazonía',
                'username' => 'supervisor_amazonia',
                'email' => 'amazonia@example.com',
                'password' => 'amazonia123',
                'provincias' => [
                    'Sucumbios', 'Sucumbíos', 'Napo', 'Orellana', 'Pastaza',
                    'Morona Santiago', 'Zamora Chinchipe'
                ]
            ]
        ];

        $ecuadorId = \App\Models\Pais::where('codigo_iso', 'EC')->value('id');
        if (!$ecuadorId) {
            return;
        }

        foreach ($supervisores as $data) {
            // Crear o actualizar el usuario
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'username' => $data['username'],
                    'password' => Hash::make($data['password']),
                    'activo' => true,
                    'pais_id' => $ecuadorId, // Ecuador
                ]
            );

            // Asignar rol de supervisor
            $roleService->syncRolesToUser($user, [$supervisorRole->id]);

            // Buscar las provincias en la BD y sincronizar
            $territoriosIds = Territorio::whereNull('parent_id') // Nivel Provincia
                ->where('pais_id', $ecuadorId) // Ecuador
                ->whereIn('nombre', $data['provincias'])
                ->pluck('id')
                ->toArray();

            $user->territorios()->sync($territoriosIds);
        }
    }
}
