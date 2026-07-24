<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (config('database.default') === 'sqlite') {
            return; // skip for sqlite
        }
        Schema::create('metrics.fact_cobertura', function (Blueprint $table) {
            $table->id();

            $table->unsignedInteger('tiempo_id')->index();
            $table->foreign('tiempo_id')->references('id')->on('metrics.dim_tiempo')->cascadeOnDelete();

            $table->foreignId('hu_id')->constrained('metrics.dim_historia_usuario')->cascadeOnDelete();

            $table->boolean('aprobada');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        if (config('database.default') === 'sqlite') {
            return; // skip for sqlite
        }
        Schema::dropIfExists('metrics.fact_cobertura');
    }
};
