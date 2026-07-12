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
            
            $table->unsignedTinyInteger('capa_id')->index();
            $table->foreign('capa_id')->references('id')->on('metrics.dim_capa')->cascadeOnDelete();
            
            $table->foreignId('vulnerabilidad_id')->constrained('metrics.dim_vulnerabilidad')->cascadeOnDelete();
            
            $table->string('componente_afectado'); // Paquete composer o ruta del archivo JS
            $table->integer('linea_afectada')->nullable(); // 0 para backend/paquetes, integer para frontend
            $table->text('codigo_sospechoso')->nullable(); // snippet sospechoso, null para backend
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metrics.fact_security');
    }
};
