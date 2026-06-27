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
        // 1. Soporte Técnico (Raíz)
        $soporte = CategoriaIncidencia::create([
            'parent_id' => null,
            'nombre' => 'Soporte Técnico',
            'descripcion' => 'Incidencias relacionadas con equipos informáticos, software y conectividad.',
        ]);

        // 1.1 Hardware (Nivel Medio)
        $hardware = CategoriaIncidencia::create([
            'parent_id' => $soporte->id,
            'nombre' => 'Hardware',
            'descripcion' => 'Problemas físicos con dispositivos y periféricos.',
        ]);

        // 1.1.1 PC / Laptop (Hojas)
        CategoriaIncidencia::create([
            'parent_id' => $hardware->id,
            'nombre' => 'PC / Laptop',
            'descripcion' => 'Fallas en computadoras de escritorio y laptops.',
        ]);

        // 1.1.2 Impresoras (Hojas)
        CategoriaIncidencia::create([
            'parent_id' => $hardware->id,
            'nombre' => 'Impresoras y Escáneres',
            'descripcion' => 'Problemas de impresión o digitalización.',
        ]);

        // 1.2 Software (Nivel Medio)
        $software = CategoriaIncidencia::create([
            'parent_id' => $soporte->id,
            'nombre' => 'Software',
            'descripcion' => 'Problemas con sistemas operativos y aplicaciones.',
        ]);

        // 1.2.1 Correo Corporativo (Hojas)
        CategoriaIncidencia::create([
            'parent_id' => $software->id,
            'nombre' => 'Correo Corporativo',
            'descripcion' => 'Problemas de acceso o configuración de correo electrónico.',
        ]);

        // 1.2.2 ERP Interno (Hojas)
        CategoriaIncidencia::create([
            'parent_id' => $software->id,
            'nombre' => 'Sistema ERP',
            'descripcion' => 'Fallas en el sistema de planificación de recursos empresariales.',
        ]);


        // 2. Mantenimiento de Infraestructura (Raíz)
        $mantenimiento = CategoriaIncidencia::create([
            'parent_id' => null,
            'nombre' => 'Mantenimiento de Infraestructura',
            'descripcion' => 'Problemas físicos en las instalaciones y servicios básicos.',
        ]);

        // 2.1 Electricidad (Hojas bajo Mantenimiento)
        CategoriaIncidencia::create([
            'parent_id' => $mantenimiento->id,
            'nombre' => 'Electricidad',
            'descripcion' => 'Cortes de luz, tomacorrientes dañados o luminarias.',
        ]);

        // 2.2 Plomería / Gasfitería (Hojas bajo Mantenimiento)
        CategoriaIncidencia::create([
            'parent_id' => $mantenimiento->id,
            'nombre' => 'Plomería / Gasfitería',
            'descripcion' => 'Filtraciones de agua, inodoros o cañerías obstruidas.',
        ]);
    }
}
