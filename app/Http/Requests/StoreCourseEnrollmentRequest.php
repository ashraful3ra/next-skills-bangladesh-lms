<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Course\CourseEnrollment;

class StoreCourseEnrollmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'course_id' => [
                'required',
                'exists:courses,id',
                function ($attribute, $value, $fail) {
                    if (CourseEnrollment::where('user_id', $this->user_id)
                        ->where('course_id', $value)
                        ->exists()
                    ) {
                        $fail('This user is already enrolled in this course.');
                    }
                },
            ],
            'enrollment_type' => 'required|string|in:free,paid',
            
            // Updated Rules: Made Optional
            'amount'          => 'nullable|numeric|min:0', 
            'payment_method'  => 'nullable|string|in:bKash,Nagad,Rocket,Bank',
            'transaction_id'  => 'nullable|string|max:255', // এখন এটি আর বাধ্যতামূলক নয়
            
            // Coupon logic
            'coupon_applied'  => 'boolean',
            'coupon_code'     => 'nullable|string', // Coupon code এখন optional রাখা হলো
            'discount_amount' => 'nullable|numeric|min:0',
        ];
    }
}