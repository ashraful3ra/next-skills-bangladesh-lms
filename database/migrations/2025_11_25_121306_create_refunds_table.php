<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique(); // ইউনিক লিংকের জন্য
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->string('batch_no')->nullable();
            
            // টাকার হিসাব
            $table->decimal('total_paid', 10, 2);
            $table->decimal('refund_amount', 10, 2);
            $table->integer('service_charge_percentage')->default(0);
            $table->decimal('service_charge_amount', 10, 2)->default(0);
            
            // স্ট্যাটাস: initiated, pending, approved, paid
            $table->string('status')->default('initiated');
            
            // ছাত্রের পূরণ করা তথ্য
            $table->string('refund_method')->nullable(); // bKash, Rocket, Nagad
            $table->string('account_number')->nullable();
            $table->text('reason')->nullable();
            
            $table->boolean('is_link_used')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refunds');
    }
};