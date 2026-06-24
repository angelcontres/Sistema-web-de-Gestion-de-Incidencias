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
        Schema::create('metrics.performance_logs', function (Blueprint $table) {
            $table->id();
            $table->integer('trp')->comment('Tiempo de respuesta en milisegundos');
            $table->string('endpoint');
            $table->string('metodo', 10);
            $table->timestamp('logged_at');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metrics.performance_logs');
    }
};
