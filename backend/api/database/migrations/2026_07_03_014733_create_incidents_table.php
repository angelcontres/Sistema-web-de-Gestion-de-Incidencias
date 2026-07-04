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
        Schema::create('reporte_incidencias', function (Blueprint $table) {
            $table->id();
            $table->text('incidencia_descripcion')->nullable();
            $table->foreignId('direccion_id')->nullable()->constrained('direcciones')->nullOnDelete();
            $table->foreignId('cliente_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('estado_id')->nullable()->constrained('estados_incidencia')->nullOnDelete();
            $table->foreignId('institucion_id')->nullable()->constrained('instituciones')->nullOnDelete();
            $table->foreignId('tipo_incidencia_id')->nullable()->constrained('categorias_incidencia')->nullOnDelete();
            $table->foreignId('sub_tipo_incidencia_id')->nullable()->constrained('categorias_incidencia')->nullOnDelete();
            $table->foreignId('prioridad_id')->nullable()->constrained('prioridades')->nullOnDelete();
            $table->integer('cantidad_afectados_incidencia')->default(0);
            $table->integer('version')->default(1); // Optimistic locking
            $table->timestamps();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reporte_incidencias');
    }
};
