<?php

namespace Database\Seeders;

use App\Models\EstadoIncidencia;
use Illuminate\Database\Seeder;

class EstadoIncidenciaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $estados = [
            ['id' => 1, 'nombre' => 'Borrador'],
            ['id' => 2, 'nombre' => 'En Revisión'],
            ['id' => 3, 'nombre' => 'Aprobado'],
            ['id' => 4, 'nombre' => 'Rechazado'],
        ];

        foreach ($estados as $estado) {
            EstadoIncidencia::updateOrCreate(
                ['id' => $estado['id']],
                [
                    'nombre' => $estado['nombre'],
                ]
            );
        }
    }
}
