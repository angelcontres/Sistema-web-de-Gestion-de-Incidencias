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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('pais_id')->nullable()->after('activo')->constrained('paises')->nullOnDelete();
            $table->foreignId('institucion_id')->nullable()->after('activo')->constrained('instituciones')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['users_pais_id_foreign']);
            $table->dropColumn('pais_id');
            $table->dropForeign(['users_institucion_id_foreign']);
            $table->dropColumn('institucion_id');
        });
    }
};
