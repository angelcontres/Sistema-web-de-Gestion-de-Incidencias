<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE SCHEMA IF NOT EXISTS metrics');

        Schema::create('metrics.dim_tiempo', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary(); // formato YYYYMMDDHHMMSS
            $table->timestamp('fecha');
            $table->unsignedSmallInteger('anio');
            $table->unsignedTinyInteger('mes');
            $table->unsignedTinyInteger('dia');
            $table->unsignedTinyInteger('hora');
            $table->unsignedTinyInteger('trimestre');
            $table->string('dia_semana', 15);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metrics.dim_tiempo');
    }
};
