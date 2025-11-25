<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_histories', function (Blueprint $table) {
            $table->boolean('is_full_paid')->default(0)->after('amount')->comment('1 if course is fully paid, 0 for partial');
            $table->boolean('is_refunded')->default(0)->after('is_full_paid')->comment('1 if payment is refunded');
        });
    }

    public function down(): void
    {
        Schema::table('payment_histories', function (Blueprint $table) {
            $table->dropColumn(['is_full_paid', 'is_refunded']);
        });
    }
};