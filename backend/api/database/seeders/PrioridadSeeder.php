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
            ['id' => 1, 'nombre' => 'Urgente', 'color_hex' => '#dc3545'], // rojo
            ['id' => 2, 'nombre' => 'Alta', 'color_hex' => '#fd7e14'], // naranja
            ['id' => 3, 'nombre' => 'Media', 'color_hex' => '#ffc107'], // amarillo
            ['id' => 4, 'nombre' => 'Baja', 'color_hex' => '#0d6efd'], // azul
        ];

        foreach ($prioridades as $prioridad) {
            Prioridad::updateOrCreate(['id' => $prioridad['id']], $prioridad);
        }
    }
}
