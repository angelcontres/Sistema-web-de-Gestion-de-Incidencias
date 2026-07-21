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
            ['id' => 1, 'nombre' => 'Pendiente'],
            ['id' => 2, 'nombre' => 'En Revisión'],
            ['id' => 3, 'nombre' => 'En Proceso'],
            ['id' => 4, 'nombre' => 'Resuelto'],
            ['id' => 5, 'nombre' => 'Rechazado'],
        ];

        // Evitar error de constraint unique renombrando temporalmente
        foreach (EstadoIncidencia::all() as $estadoExistente) {
            $estadoExistente->update(['nombre' => $estadoExistente->nombre.'_tmp_'.$estadoExistente->id]);
        }

        foreach ($estados as $estado) {
            EstadoIncidencia::updateOrCreate(
                ['id' => $estado['id']],
                [
                    'nombre' => $estado['nombre'],
                ]
            );
        }

        // Clean up any old states that are no longer used
        EstadoIncidencia::where('id', '>', 5)->delete();
    }
}
