<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => 'holamundo',
        ]);

        Role::create([
            'nombre' => 'Admin',
            'descripcion' => 'Acceso total a todos los módulos del sistema.',
            'padre_id' => null,
            'created_by' => $user->id,
        ]);
        Role::create([
            'nombre' => 'Operador',
            'descripcion' => 'EL que opera XDDD',
            'padre_id' => null,
            'created_by' => $user->id,
        ]);

        Role::create([
            'nombre' => 'Institucion',
            'descripcion' => 'Instituciones que solventa, ejem: Bomberos, Policias, etc',
            'padre_id' => null,
            'created_by' => $user->id,
        ]);
    }
}
