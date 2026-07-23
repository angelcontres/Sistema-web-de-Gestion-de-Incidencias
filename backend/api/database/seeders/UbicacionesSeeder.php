<?php

namespace Database\Seeders;

use App\Enums\TipoTerritorio;
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
        $peru = Pais::updateOrCreate(
            ['id' => 1],
            ['codigo_iso' => 'PE', 'nombre' => 'Perú', 'activo' => true]
        );

        $mexico = Pais::updateOrCreate(
            ['id' => 2],
            ['codigo_iso' => 'MX', 'nombre' => 'México', 'activo' => true]
        );

        $ecuador = Pais::updateOrCreate(
            ['id' => 3],
            ['codigo_iso' => 'EC', 'nombre' => 'Ecuador', 'activo' => true]
        );

        // 2. Territorios (Perú)
        // Nivel 1: Departamentos
        $limaDpto = Territorio::updateOrCreate(
            ['pais_id' => $peru->id, 'parent_id' => null, 'nombre' => 'Lima'],
            ['tipo' => TipoTerritorio::DEPARTAMENTO]
        );

        $arequipaDpto = Territorio::updateOrCreate(
            ['pais_id' => $peru->id, 'parent_id' => null, 'nombre' => 'Arequipa'],
            ['tipo' => TipoTerritorio::DEPARTAMENTO]
        );

        // Nivel 2: Provincias
        $limaProv = Territorio::updateOrCreate(
            ['pais_id' => $peru->id, 'parent_id' => $limaDpto->id, 'nombre' => 'Lima'],
            ['tipo' => TipoTerritorio::PROVINCIA]
        );

        $arequipaProv = Territorio::updateOrCreate(
            ['pais_id' => $peru->id, 'parent_id' => $arequipaDpto->id, 'nombre' => 'Arequipa'],
            ['tipo' => TipoTerritorio::PROVINCIA]
        );

        // Nivel 3: Distritos (Leaf nodes)
        $surco = Territorio::updateOrCreate(
            ['pais_id' => $peru->id, 'parent_id' => $limaProv->id, 'nombre' => 'Santiago de Surco'],
            ['tipo' => TipoTerritorio::DISTRITO]
        );

        $miraflores = Territorio::updateOrCreate(
            ['pais_id' => $peru->id, 'parent_id' => $limaProv->id, 'nombre' => 'Miraflores'],
            ['tipo' => TipoTerritorio::DISTRITO]
        );

        $yanahuara = Territorio::updateOrCreate(
            ['pais_id' => $peru->id, 'parent_id' => $arequipaProv->id, 'nombre' => 'Yanahuara'],
            ['tipo' => TipoTerritorio::DISTRITO]
        );

        // Territorios (México)
        // Nivel 1: Estados
        $cdmx = Territorio::updateOrCreate(
            ['pais_id' => $mexico->id, 'parent_id' => null, 'nombre' => 'Ciudad de México'],
            ['tipo' => TipoTerritorio::ESTADO]
        );

        $jalisco = Territorio::updateOrCreate(
            ['pais_id' => $mexico->id, 'parent_id' => null, 'nombre' => 'Jalisco'],
            ['tipo' => TipoTerritorio::ESTADO]
        );

        // Nivel 2: Municipios (Leaf nodes)
        $coyoacan = Territorio::updateOrCreate(
            ['pais_id' => $mexico->id, 'parent_id' => $cdmx->id, 'nombre' => 'Coyoacán'],
            ['tipo' => TipoTerritorio::ALCALDIA]
        );

        $guadalajara = Territorio::updateOrCreate(
            ['pais_id' => $mexico->id, 'parent_id' => $jalisco->id, 'nombre' => 'Guadalajara'],
            ['tipo' => TipoTerritorio::MUNICIPIO]
        );

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

            $prov = Territorio::updateOrCreate(
                ['pais_id' => $ecuador->id, 'parent_id' => null, 'codigo' => (string) $provId],
                ['nombre' => $provName, 'tipo' => TipoTerritorio::PROVINCIA]
            );

            if (! isset($provData['cantones']) || ! is_array($provData['cantones'])) {
                continue;
            }

            foreach ($provData['cantones'] as $cantId => $cantData) {
                if (! isset($cantData['canton'])) {
                    continue;
                }

                $cantName = mb_convert_case($cantData['canton'], MB_CASE_TITLE, 'UTF-8');
                $cant = Territorio::updateOrCreate(
                    ['pais_id' => $ecuador->id, 'parent_id' => $prov->id, 'codigo' => (string) $cantId],
                    ['nombre' => $cantName, 'tipo' => TipoTerritorio::CANTON]
                );

                if (! isset($cantData['parroquias']) || ! is_array($cantData['parroquias'])) {
                    continue;
                }

                foreach ($cantData['parroquias'] as $parrId => $parrNameRaw) {
                    $parrName = mb_convert_case($parrNameRaw, MB_CASE_TITLE, 'UTF-8');
                    $parr = Territorio::updateOrCreate(
                        ['pais_id' => $ecuador->id, 'parent_id' => $cant->id, 'codigo' => (string) $parrId],
                        ['nombre' => $parrName, 'tipo' => TipoTerritorio::PARROQUIA]
                    );

                    // Guardar referencia normalizada para las direcciones
                    $key = self::normalizeString("{$provName}.{$cantName}.{$parrName}");
                    $parroquias[$key] = $parr;
                }
            }
        }

        // 3. Direcciones (Asociadas al último de los nodos)
        Direccion::updateOrCreate(
            ['detalle' => 'Av. Javier Prado Este 4200', 'territorio_id' => $surco->id],
            [
                'referencia' => 'Cerca al Centro Comercial Jockey Plaza',
                'codigo_postal' => '15023',
                'latitud' => -12.11430000,
                'longitud' => -76.97490000,
            ]
        );

        Direccion::updateOrCreate(
            ['detalle' => 'Calle Larco 750', 'territorio_id' => $miraflores->id],
            [
                'referencia' => 'Frente al Parque Kennedy',
                'codigo_postal' => '15074',
                'latitud' => -12.12210000,
                'longitud' => -77.02890000,
            ]
        );

        Direccion::updateOrCreate(
            ['detalle' => 'Calle Londres 247, Del Carmen', 'territorio_id' => $coyoacan->id],
            [
                'referencia' => 'Museo Frida Kahlo (Casa Azul)',
                'codigo_postal' => '04100',
                'latitud' => 19.34960000,
                'longitud' => -99.16250000,
            ]
        );

        if (isset($parroquias['guayas.guayaquil.tarqui'])) {
            Direccion::updateOrCreate(
                ['detalle' => 'Av. Francisco de Orellana y Justino Cornejo', 'territorio_id' => $parroquias['guayas.guayaquil.tarqui']->id],
                [
                    'referencia' => 'Gobierno Zonal de Guayaquil',
                    'codigo_postal' => '090506',
                    'latitud' => -2.16430000,
                    'longitud' => -79.89720000,
                ]
            );
        }

        if (isset($parroquias['pichincha.quito.inaquito'])) {
            Direccion::updateOrCreate(
                ['detalle' => 'Av. Amazonas N37-29 y Corea', 'territorio_id' => $parroquias['pichincha.quito.inaquito']->id],
                [
                    'referencia' => 'Frente al CCI',
                    'codigo_postal' => '170504',
                    'latitud' => -0.17640000,
                    'longitud' => -78.48780000,
                ]
            );
        }

        if (isset($parroquias['santa elena.salinas.salinas'])) {
            Direccion::updateOrCreate(
                ['detalle' => 'Malecón de Salinas y Calle 19', 'territorio_id' => $parroquias['santa elena.salinas.salinas']->id],
                [
                    'referencia' => 'Frente a la Playa de San Lorenzo, Salinas',
                    'codigo_postal' => '241550',
                    'latitud' => -2.21720000,
                    'longitud' => -80.96340000,
                ]
            );
        }

        if (isset($parroquias['santa elena.la libertad.la libertad'])) {
            Direccion::updateOrCreate(
                ['detalle' => 'Av. Eleodoro Solorzano, Paseo Shopping', 'territorio_id' => $parroquias['santa elena.la libertad.la libertad']->id],
                [
                    'referencia' => 'Centro Comercial Paseo Shopping La Libertad',
                    'codigo_postal' => '240201',
                    'latitud' => -2.22850000,
                    'longitud' => -80.91020000,
                ]
            );
        }

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
