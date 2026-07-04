<?php

namespace Database\Seeders;

use App\Models\Institucion;
use Illuminate\Database\Seeder;

class InstitucionesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $instituciones = [
            ['nombre' => 'Policía Nacional del Ecuador', 'siglas' => 'PNE'],
            ['nombre' => 'Empresa Pública Metropolitana de Movilidad y Obras Públicas', 'siglas' => 'EPMMOP'],
            ['nombre' => 'Empresa Eléctrica Quito', 'siglas' => 'EEQ'],
            ['nombre' => 'Empresa Pública Metropolitana de Agua Potable y Saneamiento', 'siglas' => 'EPMAPS'],
            ['nombre' => 'Empresa Metropolitana de Gestión Integral de Residuos Sólidos', 'siglas' => 'EMGIRS'],
            ['nombre' => 'Dirección de Medio Ambiente Municipal', 'siglas' => 'DMA'],
            ['nombre' => 'Comisión de Tránsito del Ecuador', 'siglas' => 'CTE'],
        ];

        foreach ($instituciones as $i) {
            Institucion::create($i);
        }
    }
}
