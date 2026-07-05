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
            ['id' => 2, 'nombre' => 'Pendiente'],
            ['id' => 3, 'nombre' => 'En Revisión'],
            ['id' => 4, 'nombre' => 'En Proceso'],
            ['id' => 5, 'nombre' => 'Resuelto'],
            ['id' => 6, 'nombre' => 'Rechazado'],
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
