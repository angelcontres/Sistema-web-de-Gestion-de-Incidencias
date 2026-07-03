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
        Schema::table('categorias_incidencia', function (Blueprint $table) {
            $table->foreignId('institucion_id')->nullable()->constrained('instituciones');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categorias_incidencia', function (Blueprint $table) {
            $table->dropForeign(['institucion_id']);
            $table->dropColumn('institucion_id');
        });
    }
};
