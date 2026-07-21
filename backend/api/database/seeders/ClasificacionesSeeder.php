<?php

namespace Database\Seeders;

use App\Models\CategoriaIncidencia;
use App\Models\Institucion;
use Illuminate\Database\Seeder;

class ClasificacionesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pne = Institucion::where('siglas', 'PNE')->first();
        $epmmop = Institucion::where('siglas', 'EPMMOP')->first();
        $eeq = Institucion::where('siglas', 'EEQ')->first();
        $epmaps = Institucion::where('siglas', 'EPMAPS')->first();
        $emgirs = Institucion::where('siglas', 'EMGIRS')->first();
        $dma = Institucion::where('siglas', 'DMA')->first();
        $cte = Institucion::where('siglas', 'CTE')->first();
        // 1. Seguridad Ciudadana y Delitos (Raíz)
        $seguridad = CategoriaIncidencia::updateOrCreate(
            ['parent_id' => null, 'nombre' => 'Seguridad Ciudadana y Delitos'],
            [
                'descripcion' => 'Reportes de seguridad de prioridad alta y emergencias ciudadanas.',
                'activo' => true,
            ]
        );

        CategoriaIncidencia::updateOrCreate(
            ['parent_id' => $seguridad->id, 'nombre' => 'Delitos contra las personas'],
            [
                'prioridad_id' => 1, // Crítica
                'institucion_id' => $pne?->id,
                'descripcion' => 'Homicidios, agresiones físicas, peleas callejeras y violencia doméstica.',
                'activo' => true,
            ]
        );

        CategoriaIncidencia::updateOrCreate(
            ['parent_id' => $seguridad->id, 'nombre' => 'Delitos contra la propiedad'],
            [
                'prioridad_id' => 2, // Alta
                'institucion_id' => $pne?->id,
                'descripcion' => 'Robos a viviendas, asaltos en la vía pública, robo de vehículos y hurtos.',
                'activo' => true,
            ]
        );

        CategoriaIncidencia::updateOrCreate(
            ['parent_id' => $seguridad->id, 'nombre' => 'Alteración del orden público'],
            [
                'prioridad_id' => 3, // Media
                'institucion_id' => $pne?->id,
                'descripcion' => 'Consumo de drogas/alcohol en calles, vandalismo, grafitis y riñas vecinales.',
                'activo' => true,
            ]
        );

        CategoriaIncidencia::updateOrCreate(
            ['parent_id' => $seguridad->id, 'nombre' => 'Actividad sospechosa'],
            [
                'prioridad_id' => 4, // Baja
                'institucion_id' => $pne?->id,
                'descripcion' => 'Vehículos abandonados o personas merodeando de forma inusual.',
                'activo' => true,
            ]
        );

        // 2. Infraestructura y Vía Pública (Raíz)
        $infraestructura = CategoriaIncidencia::updateOrCreate(
            ['parent_id' => null, 'nombre' => 'Infraestructura y Vía Pública'],
            [
                'descripcion' => 'Reportes relacionados con el mantenimiento de la vía pública y equipamiento urbano.',
                'activo' => true,
            ]
        );

        CategoriaIncidencia::updateOrCreate(
            ['parent_id' => $infraestructura->id, 'nombre' => 'Pavimento y aceras'],
            [
                'prioridad_id' => 3, // Media
                'institucion_id' => $epmmop?->id,
                'descripcion' => 'Baches, grietas en el asfalto, baldosas rotas y falta de rampas de accesibilidad.',
                'activo' => true,
            ]
        );

        CategoriaIncidencia::updateOrCreate(
            ['parent_id' => $infraestructura->id, 'nombre' => 'Mobiliario urbano'],
            [
                'prioridad_id' => 4, // Baja
                'institucion_id' => $epmmop?->id,
                'descripcion' => 'Bancos rotos, papeleras dañadas, bolardos caídos y vallas rotas.',
                'activo' => true,
            ]
        );

        CategoriaIncidencia::updateOrCreate(
            ['parent_id' => $infraestructura->id, 'nombre' => 'Obras y señalización'],
            [
                'prioridad_id' => 2, // Alta (Puede causar accidentes)
                'institucion_id' => $epmmop?->id,
                'descripcion' => 'Escombros abandonados, zanjas sin tapar y falta de señalización de peligro.',
                'activo' => true,
            ]
        );

        // 3. Servicios Urbanos y Suministros (Raíz)
        $servicios = CategoriaIncidencia::updateOrCreate(
            ['parent_id' => null, 'nombre' => 'Servicios Urbanos y Suministros'],
            [
                'descripcion' => 'Reportes e incidencias sobre servicios públicos básicos y suministros.',
                'activo' => true,
            ]
        );

        CategoriaIncidencia::updateOrCreate(
            ['parent_id' => $servicios->id, 'nombre' => 'Alumbrado público'],
            [
                'prioridad_id' => 3, // Media
                'institucion_id' => $eeq?->id,
                'descripcion' => 'Farolas apagadas, luces intermitentes, sectores oscuros o cables eléctricos expuestos.',
                'activo' => true,
            ]
        );

        CategoriaIncidencia::updateOrCreate(
            ['parent_id' => $servicios->id, 'nombre' => 'Agua y alcantarillado'],
            [
                'prioridad_id' => 1, // Crítica (Afectación masiva)
                'institucion_id' => $epmaps?->id,
                'descripcion' => 'Fugas de agua potable, tuberías rotas, alcantarillas tapadas o inundaciones.',
                'activo' => true,
            ]
        );

        CategoriaIncidencia::updateOrCreate(
            ['parent_id' => $servicios->id, 'nombre' => 'Gestión de residuos'],
            [
                'prioridad_id' => 2, // Alta (Riesgo sanitario)
                'institucion_id' => $emgirs?->id,
                'descripcion' => 'Contenedores de basura desbordados, rotos o acumulación de desechos en la calle.',
                'activo' => true,
            ]
        );

        // 4. Medio Ambiente y Movilidad (Raíz)
        $medioAmbiente = CategoriaIncidencia::updateOrCreate(
            ['parent_id' => null, 'nombre' => 'Medio Ambiente y Movilidad'],
            [
                'descripcion' => 'Reportes de tránsito, control de plagas y mantenimiento ambiental.',
                'activo' => true,
            ]
        );

        CategoriaIncidencia::updateOrCreate(
            ['parent_id' => $medioAmbiente->id, 'nombre' => 'Parques y áreas verdes'],
            [
                'prioridad_id' => 3, // Media
                'institucion_id' => $dma?->id,
                'descripcion' => 'Árboles caídos, ramas con riesgo de desprendimiento y falta de mantenimiento en gardens.',
                'activo' => true,
            ]
        );

        CategoriaIncidencia::updateOrCreate(
            ['parent_id' => $medioAmbiente->id, 'nombre' => 'Plagas y salud ambiental'],
            [
                'prioridad_id' => 1, // Crítica (Salud pública)
                'institucion_id' => $dma?->id,
                'descripcion' => 'Presencia de roedores, insectos, acumulación de animales callejeros o malos olores.',
                'activo' => true,
            ]
        );

        CategoriaIncidencia::updateOrCreate(
            ['parent_id' => $medioAmbiente->id, 'nombre' => 'Tránsito y movilidad'],
            [
                'prioridad_id' => 2, // Alta (Riesgo vial)
                'institucion_id' => $cte?->id,
                'descripcion' => 'Semáforos averiados, señales de tráfico destruidas y coches mal estacionados que bloquean accesos.',
                'activo' => true,
            ]
        );
    }
}
