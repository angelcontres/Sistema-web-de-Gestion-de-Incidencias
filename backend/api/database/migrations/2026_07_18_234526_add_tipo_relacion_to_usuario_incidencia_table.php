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
        Schema::table('usuario_incidencia', function (Blueprint $table) {
            $table->enum('tipo_relacion', ['reportante', 'operador'])->default('reportante')->after('reporte_incidencia_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('usuario_incidencia', function (Blueprint $table) {
            $table->dropColumn('tipo_relacion');
        });
    }
};
