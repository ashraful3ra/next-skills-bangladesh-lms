<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_enrollments', function (Blueprint $table) {
            $table->decimal('amount', 10, 2)->default(0)->after('enrollment_type');
            $table->string('payment_method')->nullable()->after('amount'); // bKash, Nagad, etc.
            $table->string('transaction_id')->nullable()->after('payment_method');
            $table->boolean('coupon_applied')->default(false)->after('transaction_id');
            $table->string('coupon_code')->nullable()->after('coupon_applied');
            $table->decimal('discount_amount', 10, 2)->default(0)->after('coupon_code');
        });
    }
};
