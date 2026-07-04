<?php

namespace Database\Seeders;

use App\Models\Prioridad;
use Illuminate\Database\Seeder;

class PrioridadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $prioridades = [
            ['nombre' => 'Urgente', 'color_hex' => '#dc3545'], // rojo
            ['nombre' => 'Alta', 'color_hex' => '#fd7e14'], // naranja
            ['nombre' => 'Media', 'color_hex' => '#ffc107'], // amarillo
            ['nombre' => 'Baja', 'color_hex' => '#0d6efd'], // azul
        ];

        foreach ($prioridades as $prioridad) {
            Prioridad::firstOrCreate(['nombre' => $prioridad['nombre']], $prioridad);
        }
    }
}
