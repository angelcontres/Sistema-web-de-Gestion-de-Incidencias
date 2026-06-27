<?php

namespace Database\Seeders;

use App\Models\Direccion;
use App\Models\Pais;
use App\Models\Territorio;
use Illuminate\Database\Seeder;

class UbicacionesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Paises
        $peru = Pais::create([
            'nombre' => 'Perú',
            'codigo_iso' => 'PE',
            'activo' => true,
        ]);

        $mexico = Pais::create([
            'nombre' => 'México',
            'codigo_iso' => 'MX',
            'activo' => true,
        ]);

        // 2. Territorios (Perú)
        // Nivel 1: Departamentos
        $limaDpto = Territorio::create([
            'pais_id' => $peru->id,
            'parent_id' => null,
            'nombre' => 'Lima',
            'tipo' => 'Departamento',
        ]);

        $arequipaDpto = Territorio::create([
            'pais_id' => $peru->id,
            'parent_id' => null,
            'nombre' => 'Arequipa',
            'tipo' => 'Departamento',
        ]);

        // Nivel 2: Provincias
        $limaProv = Territorio::create([
            'pais_id' => $peru->id,
            'parent_id' => $limaDpto->id,
            'nombre' => 'Lima',
            'tipo' => 'Provincia',
        ]);

        $arequipaProv = Territorio::create([
            'pais_id' => $peru->id,
            'parent_id' => $arequipaDpto->id,
            'nombre' => 'Arequipa',
            'tipo' => 'Provincia',
        ]);

        // Nivel 3: Distritos (Leaf nodes)
        $surco = Territorio::create([
            'pais_id' => $peru->id,
            'parent_id' => $limaProv->id,
            'nombre' => 'Santiago de Surco',
            'tipo' => 'Distrito',
        ]);

        $miraflores = Territorio::create([
            'pais_id' => $peru->id,
            'parent_id' => $limaProv->id,
            'nombre' => 'Miraflores',
            'tipo' => 'Distrito',
        ]);

        $yanahuara = Territorio::create([
            'pais_id' => $peru->id,
            'parent_id' => $arequipaProv->id,
            'nombre' => 'Yanahuara',
            'tipo' => 'Distrito',
        ]);

        // Territorios (México)
        // Nivel 1: Estados
        $cdmx = Territorio::create([
            'pais_id' => $mexico->id,
            'parent_id' => null,
            'nombre' => 'Ciudad de México',
            'tipo' => 'Estado',
        ]);

        $jalisco = Territorio::create([
            'pais_id' => $mexico->id,
            'parent_id' => null,
            'nombre' => 'Jalisco',
            'tipo' => 'Estado',
        ]);

        // Nivel 2: Municipios (Leaf nodes)
        $coyoacan = Territorio::create([
            'pais_id' => $mexico->id,
            'parent_id' => $cdmx->id,
            'nombre' => 'Coyoacán',
            'tipo' => 'Alcaldía',
        ]);

        $guadalajara = Territorio::create([
            'pais_id' => $mexico->id,
            'parent_id' => $jalisco->id,
            'nombre' => 'Guadalajara',
            'tipo' => 'Municipio',
        ]);

        // 3. Direcciones (Asociadas al último nodo)
        Direccion::create([
            'territorio_id' => $surco->id,
            'detalle' => 'Av. Javier Prado Este 4200',
            'referencia' => 'Cerca al Centro Comercial Jockey Plaza',
            'codigo_postal' => '15023',
        ]);

        Direccion::create([
            'territorio_id' => $miraflores->id,
            'detalle' => 'Calle Larco 750',
            'referencia' => 'Frente al Parque Kennedy',
            'codigo_postal' => '15074',
        ]);

        Direccion::create([
            'territorio_id' => $coyoacan->id,
            'detalle' => 'Calle Londres 247, Del Carmen',
            'referencia' => 'Museo Frida Kahlo (Casa Azul)',
            'codigo_postal' => '04100',
        ]);
    }
}
