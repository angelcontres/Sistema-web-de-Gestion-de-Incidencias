<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metrics.fact_security', function (Blueprint $table) {
            $table->id();
            
            $table->unsignedInteger('tiempo_id')->index();
            $table->foreign('tiempo_id')->references('id')->on('metrics.dim_tiempo')->cascadeOnDelete();
            
            $table->integer('vulnerabilidades_criticas');
            $table->integer('vulnerabilidades_altas');
            $table->integer('vulnerabilidades_medias');
            $table->integer('vulnerabilidades_bajas');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metrics.fact_security');
    }
};
