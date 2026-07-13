<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metrics.dim_vulnerabilidad', function (Blueprint $table) {
            $table->id();
            $table->string('hash_identificador', 64)->unique();
            $table->string('titulo');
            $table->string('severidad', 20);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metrics.dim_vulnerabilidad');
    }
};
