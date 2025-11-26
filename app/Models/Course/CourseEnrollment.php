<?php

namespace App\Models\Course;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseEnrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'enrolled_by', // <--- Notun Column
        'enrollment_type',
        'entry_date',
        'expiry_date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    // Notun Relation: Ke enroll koreche
    public function enrolledBy()
    {
        return $this->belongsTo(User::class, 'enrolled_by');
    }
}