<?php

namespace App\Models;

use App\Models\User;
use App\Models\Course\Course;
use App\Models\Course\CourseCoupon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
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
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
