<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Enroll Table e ke enroll korche
        Schema::table('course_enrollments', function (Blueprint $table) {
            $table->foreignId('enrolled_by')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
        });

        // 2. Payment History Table e ke payment create korche
        Schema::table('payment_histories', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
        });

        // 3. Refund Table e ke initiate, approve ebong pay korche
        Schema::table('refunds', function (Blueprint $table) {
            $table->foreignId('initiated_by')->nullable()->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->foreignId('paid_by')->nullable()->constrained('users');
        });

        // 4. Delete Log rakhar jonno alada table
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('action'); // 'deleted_enrollment', 'deleted_payment'
            $table->string('description'); // Details like "Deleted enrollment for User X"
            $table->foreignId('performed_by')->constrained('users'); // Ke delete korlo
            $table->json('data')->nullable(); // Deleted data backup (optional)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('course_enrollments', function (Blueprint $table) {
            $table->dropColumn('enrolled_by');
        });
        Schema::table('payment_histories', function (Blueprint $table) {
            $table->dropColumn('created_by');
        });
        Schema::table('refunds', function (Blueprint $table) {
            $table->dropColumn(['initiated_by', 'approved_by', 'paid_by']);
        });
        Schema::dropIfExists('activity_logs');
    }
};