<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metrics.fact_testing', function (Blueprint $table) {
            $table->id();
            
            $table->unsignedInteger('tiempo_id')->index();
            $table->foreign('tiempo_id')->references('id')->on('metrics.dim_tiempo')->cascadeOnDelete();
            
            $table->integer('total_pruebas');
            $table->integer('pruebas_aprobadas');
            $table->integer('pruebas_fallidas');
            $table->integer('pruebas_omitidas');
            $table->decimal('tep', 5, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metrics.fact_testing');
    }
};
