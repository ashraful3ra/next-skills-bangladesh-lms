<?php

namespace App\Services\Course;

use App\Models\Course\CourseEnrollment;
use App\Models\Course\SectionLesson;
use App\Models\Course\SectionQuiz;
use App\Models\PaymentHistory;
use App\Services\Course\CourseSectionService;
use App\Services\MediaService;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class CourseEnrollmentService extends MediaService
{
   function getEnrollmentById(int $id): ?CourseEnrollment
   {
      return CourseEnrollment::with(['user', 'course'])->find($id);
   }

   function getEnrollmentByCourseId(int $courseId, int $userId): ?CourseEnrollment
   {
      return CourseEnrollment::where('course_id', $courseId)->where('user_id', $userId)->first();
   }

   function getEnrollments(array $data, bool $paginate = false): LengthAwarePaginator|Collection
   {
      $page = array_key_exists('per_page', $data) ? intval($data['per_page']) : 10;

      $enrollments = CourseEnrollment::with(['user', 'course.instructor.user'])
         ->when(array_key_exists('search', $data), function ($query) use ($data) {
            return $query->whereHas('course', function ($course) use ($data) {
               $course->where('title', 'LIKE', '%' . $data['search'] . '%');
            });
         })
         ->when(array_key_exists('instructor_id', $data), function ($query) use ($data) {
            return $query->whereHas('course.instructor.user', function ($user) use ($data) {
               $user->where('id', $data['instructor_id']);
            });
         })
         ->when(array_key_exists('user_id', $data), function ($query) use ($data) {
            $query->where('user_id', $data['user_id']);
         })
         ->orderBy('created_at', 'desc');

      if ($paginate) {
         return $enrollments->paginate($page);
      }

      return $enrollments->get();
   }

   function createCourseEnroll(array $data): CourseEnrollment
   {
      return DB::transaction(function () use ($data) {
         $courseId = $data['course_id'];
         $userId = $data['user_id'];
         $courseSectionService = new CourseSectionService();

         $amount = isset($data['amount']) ? (float)$data['amount'] : 0;

         // 1. Create Enrollment
         $enrollment = CourseEnrollment::create([
             'course_id' => $courseId,
             'user_id' => $userId,
             'entry_date' => now(),
             'enrollment_type' => $amount > 0 ? 'paid' : 'free',
             'expiry_date' => $data['expiry_date'] ?? null,
             'enrolled_by' => $data['enrolled_by'] ?? null, // Added enrolled_by
         ]);

         // 2. Insert into PaymentHistory if Amount > 0
         if ($amount > 0) {
             PaymentHistory::create([
                 'user_id' => $userId,
                 'course_id' => $courseId,
                 'amount' => $amount,
                 'payment_type' => $data['payment_method'] ?? 'manual',
                 'transaction_id' => $data['transaction_id'] ?? null,
                 'invoice' => 'INV-' . strtoupper(Str::random(8)),
                 'admin_revenue' => $amount,
                 'instructor_revenue' => 0,
                 'tax' => 0,
                 'coupon' => $data['coupon_code'] ?? null,
                 'created_at' => now(),
                 'updated_at' => now(),
             ]);
         }

         // 3. Initialize Watch History
         $lessons = SectionLesson::query()->where('course_id', $courseId);
         if ($lessons->exists()) {
            $courseSectionService->initWatchHistory($courseId, 'lesson', $userId);
            return $enrollment;
         }

         $quizzes = SectionQuiz::query()->where('course_id', $courseId);
         if ($quizzes->exists()) {
            $courseSectionService->initWatchHistory($courseId, 'quiz', $userId);
            return $enrollment;
         }

         return $enrollment;
      }, 5);
   }

   function deleteEnrollment(string $id): void
   {
      $enrollment = CourseEnrollment::find($id);
      
      if ($enrollment) {
          $enrollment->delete();
      }
   }
}