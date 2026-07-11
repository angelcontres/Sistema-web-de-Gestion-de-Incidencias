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

        // Territorios (Ecuador) desde JSON completo
        $jsonPath = database_path('seeders/data/ecuador.json');
        if (! file_exists($jsonPath)) {
            throw new \Exception("El archivo ecuador.json no existe en {$jsonPath}. Asegúrese de haberlo descargado.");
        }

        $ecuadorData = json_decode(file_get_contents($jsonPath), true);
        $parroquias = [];

        foreach ($ecuadorData as $provId => $provData) {
            if (! isset($provData['provincia'])) {
                continue;
            }

            $provName = mb_convert_case($provData['provincia'], MB_CASE_TITLE, 'UTF-8');

            $prov = Territorio::create([
                'pais_id' => $ecuador->id,
                'parent_id' => null,
                'nombre' => $provName,
                'tipo' => 'Provincia',
            ]);

            if (! isset($provData['cantones']) || ! is_array($provData['cantones'])) {
                continue;
            }

            foreach ($provData['cantones'] as $cantId => $cantData) {
                if (! isset($cantData['canton'])) {
                    continue;
                }

                $cantName = mb_convert_case($cantData['canton'], MB_CASE_TITLE, 'UTF-8');
                $cant = Territorio::create([
                    'pais_id' => $ecuador->id,
                    'parent_id' => $prov->id,
                    'nombre' => $cantName,
                    'tipo' => 'Cantón',
                ]);

                if (! isset($cantData['parroquias']) || ! is_array($cantData['parroquias'])) {
                    continue;
                }

                foreach ($cantData['parroquias'] as $parrId => $parrNameRaw) {
                    $parrName = mb_convert_case($parrNameRaw, MB_CASE_TITLE, 'UTF-8');
                    $parr = Territorio::create([
                        'pais_id' => $ecuador->id,
                        'parent_id' => $cant->id,
                        'nombre' => $parrName,
                        'tipo' => 'Parroquia',
                    ]);

                    // Guardar referencia normalizada para las direcciones
                    $key = self::normalizeString("{$provName}.{$cantName}.{$parrName}");
                    $parroquias[$key] = $parr;
                }
            }
        }

        // 3. Direcciones (Asociadas al último de los nodos)
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
            'territorio_id' => $parroquias['guayas.guayaquil.tarqui']->id,
            'detalle' => 'Av. Francisco de Orellana y Justino Cornejo',
            'referencia' => 'Gobierno Zonal de Guayaquil',
            'codigo_postal' => '090506',
            'latitud' => -2.16430000,
            'longitud' => -79.89720000,
        ]);

        Direccion::create([
            'territorio_id' => $parroquias['pichincha.quito.inaquito']->id,
            'detalle' => 'Av. Amazonas N37-29 y Corea',
            'referencia' => 'Frente al CCI',
            'codigo_postal' => '170504',
            'latitud' => -0.17640000,
            'longitud' => -78.48780000,
        ]);

        Direccion::create([
            'territorio_id' => $parroquias['santa elena.salinas.salinas']->id,
            'detalle' => 'Malecón de Salinas y Calle 19',
            'referencia' => 'Frente a la Playa de San Lorenzo, Salinas',
            'codigo_postal' => '241550',
            'latitud' => -2.21720000,
            'longitud' => -80.96340000,
        ]);

        Direccion::create([
            'territorio_id' => $parroquias['santa elena.la libertad.la libertad']->id,
            'detalle' => 'Av. Eleodoro Solorzano, Paseo Shopping',
            'referencia' => 'Centro Comercial Paseo Shopping La Libertad',
            'codigo_postal' => '240201',
            'latitud' => -2.22850000,
            'longitud' => -80.91020000,
        ]);

        Direccion::create([
            'territorio_id' => $parroquias['santa elena.santa elena.manglaralto']->id,
            'detalle' => 'Calle Principal de Montañita, Sector La Punta',
            'referencia' => 'Cerca de la playa de surf de Montañita',
            'codigo_postal' => '240103',
            'latitud' => -1.82840000,
            'longitud' => -80.75310000,
        ]);
    }

    /**
     * Normaliza una cadena quitando acentos, la letra ñ y convirtiéndola a minúsculas.
     */
    private static function normalizeString(string $str): string
    {
        $str = mb_strtolower($str, 'UTF-8');
        $utf8 = [
            '/[áàâãªä]/u' => 'a',
            '/[éèêë]/u' => 'e',
            '/[íìîï]/u' => 'i',
            '/[óòôõºö]/u' => 'o',
            '/[úùûü]/u' => 'u',
            '/ç/' => 'c',
            '/ñ/' => 'n',
            '/–/' => '-',
            '/[’‘‹›‚]/u' => ' ',
            '/[“”«»„]/u' => ' ',
        ];

        return preg_replace(array_keys($utf8), array_values($utf8), $str);
    }
}
