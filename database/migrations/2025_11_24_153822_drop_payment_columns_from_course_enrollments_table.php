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
        Schema::table('course_enrollments', function (Blueprint $table) {
            $table->dropColumn([
                'amount',
                'payment_method',
                'transaction_id',
                'coupon_applied',
                'coupon_code',
                'discount_amount'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_enrollments', function (Blueprint $table) {
            $table->decimal('amount', 10, 2)->nullable();
            $table->string('payment_method')->nullable();
            $table->string('transaction_id')->nullable();
            $table->boolean('coupon_applied')->default(false);
            $table->string('coupon_code')->nullable();
            $table->decimal('discount_amount', 10, 2)->nullable();
        });
    }
};