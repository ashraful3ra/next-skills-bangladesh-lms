<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('course_live_classes', function (Blueprint $table) {
            $table->string('meeting_link')->nullable()->after('class_note');
        });
    }

    public function down()
    {
        Schema::table('course_live_classes', function (Blueprint $table) {
            $table->dropColumn('meeting_link');
        });
    }
};
