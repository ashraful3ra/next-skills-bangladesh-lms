<?php

use App\Enums\CourseModeType;
use App\Enums\CourseVisibilityType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('course_mode')
                ->default(CourseModeType::MAIN->value)
                ->after('course_type');

            $table->unsignedBigInteger('main_course_id')
                ->nullable()
                ->after('course_mode');

            $table->string('visibility')
                ->default(CourseVisibilityType::PUBLIC->value)
                ->after('status');

            $table->boolean('is_completed')
                ->default(false)
                ->after('visibility');

            $table->foreign('main_course_id')
                ->references('id')
                ->on('courses')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['main_course_id']);
            $table->dropColumn(['course_mode', 'main_course_id', 'visibility', 'is_completed']);
        });
    }
};
