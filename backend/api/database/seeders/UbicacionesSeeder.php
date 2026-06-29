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

        $ecuador = Pais::create([
            'nombre' => 'Ecuador',
            'codigo_iso' => 'EC',
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

        // Territorios (Ecuador)
        // Nivel 1: Provincias
        $guayas = Territorio::create([
            'pais_id' => $ecuador->id,
            'parent_id' => null,
            'nombre' => 'Guayas',
            'tipo' => 'Provincia',
        ]);

        $pichincha = Territorio::create([
            'pais_id' => $ecuador->id,
            'parent_id' => null,
            'nombre' => 'Pichincha',
            'tipo' => 'Provincia',
        ]);

        // Nivel 2: Cantones
        $guayaquil = Territorio::create([
            'pais_id' => $ecuador->id,
            'parent_id' => $guayas->id,
            'nombre' => 'Guayaquil',
            'tipo' => 'Cantón',
        ]);

        $quito = Territorio::create([
            'pais_id' => $ecuador->id,
            'parent_id' => $pichincha->id,
            'nombre' => 'Quito',
            'tipo' => 'Cantón',
        ]);

        // Nivel 3: Parroquias (Leaf nodes)
        $tarqui = Territorio::create([
            'pais_id' => $ecuador->id,
            'parent_id' => $guayaquil->id,
            'nombre' => 'Tarqui',
            'tipo' => 'Parroquia',
        ]);

        $inaquito = Territorio::create([
            'pais_id' => $ecuador->id,
            'parent_id' => $quito->id,
            'nombre' => 'Iñaquito',
            'tipo' => 'Parroquia',
        ]);

        // 3. Direcciones (Asociadas al último nodo)
        Direccion::create([
            'territorio_id' => $surco->id,
            'detalle' => 'Av. Javier Prado Este 4200',
            'referencia' => 'Cerca al Centro Comercial Jockey Plaza',
            'codigo_postal' => '15023',
            'latitud' => -12.11430000,
            'longitud' => -76.97490000,
        ]);

        Direccion::create([
            'territorio_id' => $miraflores->id,
            'detalle' => 'Calle Larco 750',
            'referencia' => 'Frente al Parque Kennedy',
            'codigo_postal' => '15074',
            'latitud' => -12.12210000,
            'longitud' => -77.02890000,
        ]);

        Direccion::create([
            'territorio_id' => $coyoacan->id,
            'detalle' => 'Calle Londres 247, Del Carmen',
            'referencia' => 'Museo Frida Kahlo (Casa Azul)',
            'codigo_postal' => '04100',
            'latitud' => 19.34960000,
            'longitud' => -99.16250000,
        ]);

        Direccion::create([
            'territorio_id' => $tarqui->id,
            'detalle' => 'Av. Francisco de Orellana y Justino Cornejo',
            'referencia' => 'Gobierno Zonal de Guayaquil',
            'codigo_postal' => '090506',
            'latitud' => -2.16430000,
            'longitud' => -79.89720000,
        ]);

        Direccion::create([
            'territorio_id' => $inaquito->id,
            'detalle' => 'Av. Amazonas N37-29 y Corea',
            'referencia' => 'Frente al CCI',
            'codigo_postal' => '170504',
            'latitud' => -0.17640000,
            'longitud' => -78.48780000,
        ]);
    }
}
