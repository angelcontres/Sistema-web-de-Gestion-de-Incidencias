<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metrics.dim_capa', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary(); // 1 = Backend, 2 = Frontend
            $table->string('nombre', 50);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metrics.dim_capa');
    }
};
