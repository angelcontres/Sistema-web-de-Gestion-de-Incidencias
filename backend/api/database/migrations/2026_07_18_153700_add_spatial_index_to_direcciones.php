<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Solo aplicar en PostgreSQL con PostGIS habilitado
        if (DB::getDriverName() === 'pgsql') {
            // Habilitar PostGIS primero en la base de datos
            DB::statement("CREATE EXTENSION IF NOT EXISTS postgis;");

            // Añadir columna generada geográficamente a partir de longitud y latitud
            DB::statement("ALTER TABLE direcciones ADD COLUMN ubicacion geography(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitud, latitud), 4326)::geography) STORED;");
            
            // Crear el índice espacial GIST para consultas ultrarrápidas
            DB::statement("CREATE INDEX direcciones_ubicacion_gist ON direcciones USING GIST (ubicacion);");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("DROP INDEX IF EXISTS direcciones_ubicacion_gist;");
            DB::statement("ALTER TABLE direcciones DROP COLUMN IF EXISTS ubicacion;");
        }
    }
};
