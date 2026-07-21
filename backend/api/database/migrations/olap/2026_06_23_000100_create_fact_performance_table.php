<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metrics.fact_performance', function (Blueprint $table) {
            $table->id();

            $table->unsignedInteger('tiempo_id')->index();
            $table->foreign('tiempo_id')->references('id')->on('metrics.dim_tiempo')->cascadeOnDelete();

            $table->foreignId('endpoint_id')->constrained('metrics.dim_endpoint')->cascadeOnDelete();

            $table->unsignedBigInteger('usuario_id')->nullable()->index();
            $table->foreign('usuario_id')->references('id')->on('metrics.dim_usuario')->nullOnDelete();

            $table->integer('trp')->comment('Tiempo de respuesta en milisegundos');
            $table->unsignedSmallInteger('status_code')->default(200);
            $table->timestamp('logged_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metrics.fact_performance');
    }
};
