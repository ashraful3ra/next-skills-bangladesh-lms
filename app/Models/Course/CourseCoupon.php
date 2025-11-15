<?php

namespace App\Models\Course;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseCoupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',  // Add this
        'code',
        'discount',
        'expiry',
    ];

    // Add this relationship
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Update the valid scope to check both expiry and course applicability
    public function scopeValid($query, $courseId = null)
    {
        $query = $query->where('expiry', '>=', now());

        if ($courseId) {
            $query->where(function ($q) use ($courseId) {
                $q->whereNull('course_id')
                    ->orWhere('course_id', $courseId);
            });
        }

        return $query;
    }
}
