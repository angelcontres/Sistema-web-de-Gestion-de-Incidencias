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
        Schema::create('historial_incidencias', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('incidencia_id');
            $table->unsignedBigInteger('estado_id');
            $table->unsignedBigInteger('usuario_id')->nullable();
            $table->text('comentario')->nullable();
            $table->timestamps();

            $table->foreign('incidencia_id')->references('id')->on('reporte_incidencias')->onDelete('cascade');
            $table->foreign('estado_id')->references('id')->on('estados_incidencia')->onDelete('cascade');
            $table->foreign('usuario_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historial_incidencias');
    }
};
