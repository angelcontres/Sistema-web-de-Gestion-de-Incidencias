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
        Schema::table('territorios', function (Blueprint $table) {
            $table->string('codigo')->nullable()->after('parent_id');
            $table->index(['pais_id', 'parent_id', 'codigo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('territorios', function (Blueprint $table) {
            $table->dropIndex(['pais_id', 'parent_id', 'codigo']);
            $table->dropColumn('codigo');
        });
    }
};
