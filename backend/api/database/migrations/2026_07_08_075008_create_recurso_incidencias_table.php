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
        Schema::create('recurso_incidencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incidencia_id')->constrained('reporte_incidencias')->onDelete('cascade');
            $table->string('url'); // Guarda la URL o path de S3 / Local
            $table->string('tipo')->default('imagen'); // Por si luego suben PDF, etc.
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recurso_incidencias');
    }
};
