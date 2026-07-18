<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reporte_incidencias', function (Blueprint $table) {
            $table->index('estado_id');
            $table->index('institucion_id');
            $table->index('cliente_id');
            $table->index('tipo_incidencia_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reporte_incidencias', function (Blueprint $table) {
            $table->dropIndex(['estado_id']);
            $table->dropIndex(['institucion_id']);
            $table->dropIndex(['cliente_id']);
            $table->dropIndex(['tipo_incidencia_id']);
        });
    }
};
