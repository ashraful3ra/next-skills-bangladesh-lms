<?php

namespace App\Models;

use App\Models\User;
use App\Models\Course\Course;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'created_by', // <--- Notun Column
        'course_id',
        'payment_type',
        'tax',
        'coupon',
        'amount',
        'invoice',
        'admin_revenue',
        'instructor_revenue',
        'transaction_id',
        'session_id',
        'is_full_paid',
        'is_refunded',
    ];

    protected $casts = [
        'is_full_paid' => 'boolean',
        'is_refunded' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    // Notun Relation: Ke payment create koreche
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}