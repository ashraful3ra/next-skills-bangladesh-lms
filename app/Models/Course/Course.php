<?php

namespace App\Models\Course;

use App\Models\Instructor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Course extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    /**
     * Mass assignable attributes.
     */
    protected $fillable = [
        'title',
        'slug',

        // পুরনো ফিল্ডগুলো
        'course_type',
        'status',
        'level',
        'short_description',
        'description',
        'language',

        'pricing_type',
        'price',
        'discount',
        'discount_price',
        'drip_content',

        'thumbnail',
        'banner',
        'preview',

        'expiry_type',
        'expiry_duration',
        'created_from',

        'meta_title',
        'meta_keywords',
        'meta_description',
        'og_title',
        'og_description',

        'instructor_id',
        'course_category_id',
        'course_category_child_id',

        // 🔹 নতুন ফিল্ডগুলো
        // main / batch
        'course_mode',
        // batch হলে যে main course এর আন্ডারে থাকবে
        'main_course_id',
        // batch course নম্বর
        'batch_no',
        // public / private
        'visibility',
        // course শেষ হয়েছে কিনা
        'is_completed',
    ];

    /**
     * Attribute casting.
     */
    protected $casts = [
        'price'          => 'decimal:2',
        'discount_price' => 'decimal:2',
        'discount'       => 'boolean',
        'drip_content'   => 'boolean',
        'is_completed'   => 'boolean',
    ];

    public function course_category(): BelongsTo
    {
        return $this->belongsTo(CourseCategory::class);
    }

    public function course_category_child(): BelongsTo
    {
        return $this->belongsTo(CourseCategoryChild::class);
    }

    public function live_classes(): HasMany
    {
        return $this->hasMany(CourseLiveClass::class)->orderBy('class_date_and_time', 'asc');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(CourseAssignment::class)->orderBy('created_at', 'desc');
    }

    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class)->orderBy('sort', 'asc');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(SectionLesson::class)->orderBy('sort', 'asc');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class)->orderBy('created_at', 'desc');
    }

    public function faqs(): HasMany
    {
        return $this->hasMany(CourseFaq::class)->orderBy('sort', 'asc');
    }

    public function requirements(): HasMany
    {
        return $this->hasMany(CourseRequirement::class)->orderBy('sort', 'asc');
    }

    public function outcomes(): HasMany
    {
        return $this->hasMany(CourseOutcome::class)->orderBy('sort', 'asc');
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(Instructor::class);
    }

    public function forums(): HasMany
    {
        return $this->hasMany(CourseForum::class)->orderBy('created_at', 'desc');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(CourseReview::class)->orderBy('created_at', 'desc');
    }

    public function coupons(): HasMany
    {
        return $this->hasMany(CourseCoupon::class)->orderBy('created_at', 'desc');
    }

    /**
     * 🔹 Batch/Main রিলেশন
     * mainCourse()  => কোনো batch course এর parent main course
     * batches()     => কোনো main course এর সব batch course
     */
    public function mainCourse(): BelongsTo
    {
        return $this->belongsTo(self::class, 'main_course_id');
    }

    public function batches(): HasMany
    {
        return $this->hasMany(self::class, 'main_course_id');
    }
}
