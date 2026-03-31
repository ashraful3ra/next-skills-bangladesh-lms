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
        Schema::table('section_lessons', function (Blueprint $table) {
            $table->boolean('is_free_preview')->default(false)->after('is_free');
        });
    }

    public function down(): void
    {
        Schema::table('section_lessons', function (Blueprint $table) {
            $table->dropColumn('is_free_preview');
        });
    }
};
