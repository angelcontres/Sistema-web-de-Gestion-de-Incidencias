<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metrics.dim_historia_usuario', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 20)->unique(); // Ej: HU-01
            $table->string('nombre');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metrics.dim_historia_usuario');
    }
};
