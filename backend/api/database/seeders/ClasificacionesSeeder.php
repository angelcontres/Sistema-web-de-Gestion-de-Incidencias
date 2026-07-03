<?php

namespace Database\Seeders;

use App\Models\CategoriaIncidencia;
use Illuminate\Database\Seeder;

class ClasificacionesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Seguridad Ciudadana y Delitos (Raíz)
        $seguridad = CategoriaIncidencia::create([
            'parent_id' => null,
            'nombre' => 'Seguridad Ciudadana y Delitos',
            'descripcion' => 'Reportes de seguridad de prioridad alta y emergencias ciudadanas.',
            'activo' => true,
        ]);

        CategoriaIncidencia::create([
            'parent_id' => $seguridad->id,
            'nombre' => 'Delitos contra las personas',
            'descripcion' => 'Homicidios, agresiones físicas, peleas callejeras y violencia doméstica.',
            'activo' => true,
        ]);

        CategoriaIncidencia::create([
            'parent_id' => $seguridad->id,
            'nombre' => 'Delitos contra la propiedad',
            'descripcion' => 'Robos a viviendas, asaltos en la vía pública, robo de vehículos y hurtos.',
            'activo' => true,
        ]);

        CategoriaIncidencia::create([
            'parent_id' => $seguridad->id,
            'nombre' => 'Alteración del orden público',
            'descripcion' => 'Consumo de drogas/alcohol en calles, vandalismo, grafitis y riñas vecinales.',
            'activo' => true,
        ]);

        CategoriaIncidencia::create([
            'parent_id' => $seguridad->id,
            'nombre' => 'Actividad sospechosa',
            'descripcion' => 'Vehículos abandonados o personas merodeando de forma inusual.',
            'activo' => true,
        ]);


        // 2. Infraestructura y Vía Pública (Raíz)
        $infraestructura = CategoriaIncidencia::create([
            'parent_id' => null,
            'nombre' => 'Infraestructura y Vía Pública',
            'descripcion' => 'Reportes relacionados con el mantenimiento de la vía pública y equipamiento urbano.',
            'activo' => true,
        ]);

        CategoriaIncidencia::create([
            'parent_id' => $infraestructura->id,
            'nombre' => 'Pavimento y aceras',
            'descripcion' => 'Baches, grietas en el asfalto, baldosas rotas y falta de rampas de accesibilidad.',
            'activo' => true,
        ]);

        CategoriaIncidencia::create([
            'parent_id' => $infraestructura->id,
            'nombre' => 'Mobiliario urbano',
            'descripcion' => 'Bancos rotos, papeleras dañadas, bolardos caídos y vallas rotas.',
            'activo' => true,
        ]);

        CategoriaIncidencia::create([
            'parent_id' => $infraestructura->id,
            'nombre' => 'Obras y señalización',
            'descripcion' => 'Escombros abandonados, zanjas sin tapar y falta de señalización de peligro.',
            'activo' => true,
        ]);


        // 3. Servicios Urbanos y Suministros (Raíz)
        $servicios = CategoriaIncidencia::create([
            'parent_id' => null,
            'nombre' => 'Servicios Urbanos y Suministros',
            'descripcion' => 'Reportes e incidencias sobre servicios públicos básicos y suministros.',
            'activo' => true,
        ]);

        CategoriaIncidencia::create([
            'parent_id' => $servicios->id,
            'nombre' => 'Alumbrado público',
            'descripcion' => 'Farolas apagadas, luces intermitentes, sectores oscuros o cables eléctricos expuestos.',
            'activo' => true,
        ]);

        CategoriaIncidencia::create([
            'parent_id' => $servicios->id,
            'nombre' => 'Agua y alcantarillado',
            'descripcion' => 'Fugas de agua potable, tuberías rotas, alcantarillas tapadas o inundaciones.',
            'activo' => true,
        ]);

        CategoriaIncidencia::create([
            'parent_id' => $servicios->id,
            'nombre' => 'Gestión de residuos',
            'descripcion' => 'Contenedores de basura desbordados, rotos o acumulación de desechos en la calle.',
            'activo' => true,
        ]);


        // 4. Medio Ambiente y Movilidad (Raíz)
        $medioAmbiente = CategoriaIncidencia::create([
            'parent_id' => null,
            'nombre' => 'Medio Ambiente y Movilidad',
            'descripcion' => 'Reportes de tránsito, control de plagas y mantenimiento ambiental.',
            'activo' => true,
        ]);

        CategoriaIncidencia::create([
            'parent_id' => $medioAmbiente->id,
            'nombre' => 'Parques y áreas verdes',
            'descripcion' => 'Árboles caídos, ramas con riesgo de desprendimiento y falta de mantenimiento en jardines.',
            'activo' => true,
        ]);

        CategoriaIncidencia::create([
            'parent_id' => $medioAmbiente->id,
            'nombre' => 'Plagas y salud ambiental',
            'descripcion' => 'Presencia de roedores, insectos, acumulación de animales callejeros o malos olores.',
            'activo' => true,
        ]);

        CategoriaIncidencia::create([
            'parent_id' => $medioAmbiente->id,
            'nombre' => 'Tránsito y movilidad',
            'descripcion' => 'Semáforos averiados, señales de tráfico destruidas y coches mal estacionados que bloquean accesos.',
            'activo' => true,
        ]);
    }
}
