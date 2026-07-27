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
        Schema::create('incidencia_institucion_apoyo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incidencia_id')->constrained('reporte_incidencias')->onDelete('cascade');
            $table->foreignId('institucion_id')->constrained('instituciones')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidencia_institucion_apoyo');
    }
};
