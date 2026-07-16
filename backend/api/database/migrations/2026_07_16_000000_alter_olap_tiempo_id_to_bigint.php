<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        // Solo ejecutamos la alteración si las tablas de OLAP ya existen (como en producción)
        if (Schema::hasTable('metrics.dim_tiempo') && Schema::hasTable('metrics.fact_incidencias')) {
            
            // 1. Dropear llave foránea temporalmente
            Schema::table('metrics.fact_incidencias', function (Blueprint $table) {
                $table->dropForeign(['tiempo_id']);
            });

            // 2. Modificar columnas a bigint
            DB::statement('ALTER TABLE metrics.dim_tiempo ALTER COLUMN id TYPE bigint');
            DB::statement('ALTER TABLE metrics.fact_incidencias ALTER COLUMN tiempo_id TYPE bigint');

            // 3. Recrear llave foránea
            Schema::table('metrics.fact_incidencias', function (Blueprint $table) {
                $table->foreign('tiempo_id')->references('id')->on('metrics.dim_tiempo')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        if (Schema::hasTable('metrics.dim_tiempo') && Schema::hasTable('metrics.fact_incidencias')) {
            Schema::table('metrics.fact_incidencias', function (Blueprint $table) {
                $table->dropForeign(['tiempo_id']);
            });

            DB::statement('ALTER TABLE metrics.fact_incidencias ALTER COLUMN tiempo_id TYPE integer');
            DB::statement('ALTER TABLE metrics.dim_tiempo ALTER COLUMN id TYPE integer');

            Schema::table('metrics.fact_incidencias', function (Blueprint $table) {
                $table->foreign('tiempo_id')->references('id')->on('metrics.dim_tiempo')->cascadeOnDelete();
            });
        }
    }
};
