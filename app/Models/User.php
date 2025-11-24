<?php

namespace App\Models;

use App\Models\Course\CourseEnrollment; // নিশ্চিত করুন যে এটি সঠিক পাথ
use App\Models\PaymentHistory; // নিশ্চিত করুন যে এটি সঠিক পাথ
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany; // HasMany ইম্পোর্ট করতে হবে
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Laravel\Sanctum\HasApiTokens;
use App\Notifications\VerifyEmailNotification;

class User extends Authenticatable implements HasMedia, MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, InteractsWithMedia;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'photo',
        'google_id',
        'social_links',
        'email_verified_at',
        'instructor_id',
        'phone', // নতুন মাইগ্রেশন অনুযায়ী ফোন নম্বর যোগ করা হয়েছে
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'social_links' => 'array',
        'status' => 'integer',
        'email_verified_at' => 'datetime',
    ];

    // Instructor Relationship
    public function instructor(): BelongsTo
    {
        return $this->belongsTo(Instructor::class);
    }

    // ✅ Enrollments Relationship
    public function enrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class, 'user_id');
    }

    // ✅ Payment Histories Relationship
    public function payment_histories(): HasMany
    {
        return $this->hasMany(PaymentHistory::class, 'user_id');
    }

    // Email Verification Notification
    public function sendEmailVerificationNotification()
    {
        $this->notify(new VerifyEmailNotification);
    }
}