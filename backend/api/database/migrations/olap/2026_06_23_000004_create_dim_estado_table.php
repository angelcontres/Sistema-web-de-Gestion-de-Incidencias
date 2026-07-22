<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (config("database.default") === "sqlite") { return; // skip for sqlite
 }
        Schema::create('metrics.dim_estado', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        if (config("database.default") === "sqlite") { return; // skip for sqlite
 }
        Schema::dropIfExists('metrics.dim_estado');
    }
};
