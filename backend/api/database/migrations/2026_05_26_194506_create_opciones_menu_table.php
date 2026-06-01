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
        Schema::create('opciones_menu', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50);
            $table->string('icono', 50)->nullable();
            $table->string('ruta', 255);

            // hay menús que son raiz y no tienen padre.
            $table->foreignId('padre_id')->nullable()->constrained('opciones_menu');

            // created_at
            // updated_at
            $table->timestamps();

            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');

            // Crea deleted_at automáticamente para borrado lógico
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->constrained('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('opciones_menu');
    }
};
