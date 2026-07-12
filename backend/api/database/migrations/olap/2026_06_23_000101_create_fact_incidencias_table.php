<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metrics.fact_incidencias', function (Blueprint $table) {
            $table->id();

            $table->unsignedInteger('tiempo_id')->index();
            $table->foreign('tiempo_id')->references('id')->on('metrics.dim_tiempo')->cascadeOnDelete();

            $table->foreignId('territorio_id')->constrained('metrics.dim_territorio')->cascadeOnDelete();
            $table->foreignId('categoria_id')->constrained('metrics.dim_categoria')->cascadeOnDelete();
            $table->foreignId('estado_id')->constrained('metrics.dim_estado')->cascadeOnDelete();
            $table->foreignId('prioridad_id')->constrained('metrics.dim_prioridad')->cascadeOnDelete();

            $table->unsignedBigInteger('institucion_id')->nullable()->index();
            $table->foreign('institucion_id')->references('id')->on('metrics.dim_institucion')->nullOnDelete();

            $table->unsignedBigInteger('usuario_reporta_id')->nullable()->index();
            $table->foreign('usuario_reporta_id')->references('id')->on('metrics.dim_usuario')->nullOnDelete();

            $table->unsignedInteger('cantidad')->default(1);
            $table->string('codigo_postal', 20)->nullable()->index();
            $table->integer('tiempo_respuesta_minutos')->nullable();
            $table->integer('tiempo_resolucion_minutos')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metrics.fact_incidencias');
    }
};
