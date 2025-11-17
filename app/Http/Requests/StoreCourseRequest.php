<?php

namespace App\Http\Requests;

use App\Enums\CourseModeType;
use App\Enums\CoursePricingType;
use App\Enums\CourseVisibilityType;
use App\Enums\ExpiryLimitType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseRequest extends FormRequest
{
    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // 🔹 course_mode default MAIN
        $mode = $this->input('course_mode') ?? CourseModeType::MAIN->value;

        // 🔹 boolean / numeric / relation fields normalize
        $this->merge([
            // numeric
            'price'          => $this->filled('price') ? (float) $this->input('price') : null,
            'discount_price' => $this->filled('discount_price') ? (float) $this->input('discount_price') : null,

            // boolean
            'discount'       => filter_var($this->input('discount', false), FILTER_VALIDATE_BOOLEAN),
            'drip_content'   => filter_var($this->input('drip_content', false), FILTER_VALIDATE_BOOLEAN),
            'is_completed'   => filter_var($this->input('is_completed', false), FILTER_VALIDATE_BOOLEAN),

            // relations
            'instructor_id'        => $this->filled('instructor_id') ? (int) $this->input('instructor_id') : null,
            'course_category_id'   => $this->filled('course_category_id') ? (int) $this->input('course_category_id') : null,
            'course_category_child_id' => $this->filled('course_category_child_id')
                ? (int) $this->input('course_category_child_id')
                : null,

            // mode অনুযায়ী main_course_id / batch_no ঠিক করা
            'course_mode'    => $mode,
            'main_course_id' => $mode === CourseModeType::BATCH->value
                ? ($this->filled('main_course_id') ? (int) $this->input('main_course_id') : null)
                : null,
            'batch_no'       => $mode === CourseModeType::BATCH->value
                ? $this->input('batch_no')
                : null,

            // visibility normalize (optional)
            'visibility'     => $this->input('visibility') ?? CourseVisibilityType::PUBLIC->value,
        ]);
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $free     = CoursePricingType::FREE->value;
        $paid     = CoursePricingType::PAID->value;
        $lifetime = ExpiryLimitType::LIFETIME->value;
        $limited  = ExpiryLimitType::LIMITED_TIME->value;

        $modeValues       = array_column(CourseModeType::cases(), 'value');
        $visibilityValues = array_column(CourseVisibilityType::cases(), 'value');

        return [
            // Basic info
            'title'             => ['required', 'string', 'max:255'],
            'short_description' => ['required', 'string'],
            'description'       => ['nullable', 'string'],
            'status'            => ['required', 'string'],

            // NEW: main / batch
            'course_mode'       => ['required', Rule::in($modeValues)],
            'main_course_id'    => [
                'nullable',
                'integer',
                'exists:courses,id',
                Rule::requiredIf(fn () => $this->input('course_mode') === CourseModeType::BATCH->value),
            ],
            'batch_no'          => [
                'nullable',
                'string',
                'max:100',
                Rule::requiredIf(fn () => $this->input('course_mode') === CourseModeType::BATCH->value),
            ],

            // NEW: visibility + completed
            'visibility'        => ['required', Rule::in($visibilityValues)],
            'is_completed'      => ['boolean'],

            // Meta
            'level'                 => ['required', 'string'],
            'language'              => ['required', 'string', 'max:255'],
            'drip_content'          => ['boolean'],
            'instructor_id'         => ['required', 'exists:instructors,id'],
            'course_category_id'    => ['required', 'exists:course_categories,id'],
            'course_category_child_id' => ['nullable', 'exists:course_category_children,id'],

            // Pricing
            'pricing_type'     => ["required", "string", "in:$free,$paid"],
            'price'            => ["nullable", 'numeric', 'min:1', "required_if:pricing_type,$paid"],
            'discount'         => ['boolean'],
            'discount_price'   => [
                'nullable',
                'numeric',
                'min:1',
                'lt:price',
                'required_if:discount,true',
            ],

            // Expiry
            'expiry_type'      => ["required", "string", "in:$lifetime,$limited"],
            'expiry_duration'  => ["nullable", "string", "required_if:expiry_type,$limited"],

            // Media & misc
            'thumbnail'        => ['nullable', 'image', 'max:2048'],
            'created_from'     => ['nullable', 'string', 'in:web,api'],
        ];
    }
}
