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
        if (DB::getDriverName() === 'pgsql') {
            // Habilitar PostGIS si no está habilitado
            DB::statement("CREATE EXTENSION IF NOT EXISTS postgis;");

            // Añadir columna generada y almacenada para búsquedas geográficas rápidas
            DB::statement("ALTER TABLE direcciones ADD COLUMN ubicacion geography(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitud, latitud), 4326)::geography) STORED;");

            // Crear índice espacial GIST
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
