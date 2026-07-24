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
        Schema::create('metrics.dim_territorio', function (Blueprint $table) {
            $table->id(); // ID del territorio hoja
            $table->string('pais')->nullable();
            $table->string('provincia')->nullable();
            $table->string('canton')->nullable();
            $table->string('parroquia')->nullable();
            $table->string('codigo')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        if (config('database.default') === 'sqlite') {
            return; // skip for sqlite
        }
        Schema::dropIfExists('metrics.dim_territorio');
    }
};
