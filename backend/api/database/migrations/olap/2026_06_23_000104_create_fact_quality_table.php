<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metrics.fact_quality', function (Blueprint $table) {
            $table->id();

            $table->unsignedInteger('tiempo_id')->index();
            $table->foreign('tiempo_id')->references('id')->on('metrics.dim_tiempo')->cascadeOnDelete();

            $table->foreignId('metric_id')->constrained('metrics.dim_metric')->cascadeOnDelete();

            $table->decimal('valor_porcentaje', 5, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metrics.fact_quality');
    }
};
