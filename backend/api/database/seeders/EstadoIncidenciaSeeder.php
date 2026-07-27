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
            ['nombre' => 'Pendiente'],
            ['nombre' => 'En Revisión'],
            ['nombre' => 'En Proceso'],
            ['nombre' => 'Resuelto'],
            ['nombre' => 'Rechazado'],
        ];

        foreach ($estados as $estado) {
            EstadoIncidencia::firstOrCreate($estado);
        }

        $nombresValidos = collect($estados)->pluck('nombre')->toArray();
        EstadoIncidencia::whereNotIn('nombre', $nombresValidos)->delete();
    }
}
