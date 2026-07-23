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
            ['id' => 1, 'nombre' => 'Policía Nacional del Ecuador', 'siglas' => 'PNE'],
            ['id' => 2, 'nombre' => 'Empresa Pública Metropolitana de Movilidad y Obras Públicas', 'siglas' => 'EPMMOP'],
            ['id' => 3, 'nombre' => 'Empresa Eléctrica Quito', 'siglas' => 'EEQ'],
            ['id' => 4, 'nombre' => 'Empresa Pública Metropolitana de Agua Potable y Saneamiento', 'siglas' => 'EPMAPS'],
            ['id' => 5, 'nombre' => 'Empresa Metropolitana de Gestión Integral de Residuos Sólidos', 'siglas' => 'EMGIRS'],
            ['id' => 6, 'nombre' => 'Dirección de Medio Ambiente Municipal', 'siglas' => 'DMA'],
            ['id' => 7, 'nombre' => 'Comisión de Tránsito del Ecuador', 'siglas' => 'CTE'],
        ];

        foreach ($instituciones as $i) {
            Institucion::updateOrCreate(['id' => $i['id']], $i);
        }
    }
}
