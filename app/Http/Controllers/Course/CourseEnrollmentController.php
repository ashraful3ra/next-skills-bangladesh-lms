<?php

namespace App\Http\Controllers\Course;

use App\Enums\CoursePricingType;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseEnrollmentRequest;
use App\Services\Course\CourseEnrollmentService;
use App\Services\Course\CourseService;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Course\Course;
use App\Models\Course\CourseEnrollment;
use App\Models\PaymentHistory;
use App\Models\ActivityLog;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\EnrollmentErrorExport;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class CourseEnrollmentController extends Controller
{
    public function __construct(
        private UserService $userService,
        private CourseService $courseService,
        private CourseEnrollmentService $enrollmentService,
    ) {}

    public function index(Request $request)
    {
        $user = Auth::user();
        $data = array_merge(
            $request->all(),
            isAdmin() ? [] : (
                $user->instructor ?
                ['instructor_id' => $user->instructor->id] :
                ['user_id' => $user->id])
        );
        $enrollments = $this->enrollmentService->getEnrollments($data, true);
        
        if($enrollments instanceof \Illuminate\Pagination\LengthAwarePaginator) {
            $enrollments->getCollection()->load('enrolledBy');
        }

        $courses = Course::select('id', 'title', 'batch_no')
                    ->where('status', 'approved')
                    ->get();

        return Inertia::render('dashboard/enrollments/index', compact('enrollments', 'courses'));
    }

    public function create()
    {
        $prices = CoursePricingType::cases();
        $users = $this->userService->getUsers([]);
        $courses = $this->courseService->getCourses(['status' => 'approved']);

        return Inertia::render('dashboard/enrollments/create', compact('prices', 'users', 'courses'));
    }

    public function store(StoreCourseEnrollmentRequest $request)
    {
        $data = $request->validated();
        $data['enrolled_by'] = Auth::id();

        $this->enrollmentService->createCourseEnroll($data);
        return redirect(route('enrollments.index'))->with('success', 'Enrollment is successfully done in this course');
    }

    public function destroy(string $id)
    {
        try {
            // এনরোলমেন্ট খুঁজে বের করা
            $enrollment = CourseEnrollment::with(['user', 'course'])->find($id);
            
            if ($enrollment) {
                // সেফটি চেক: ইউজার বা কোর্স ডিলিট হয়ে থাকলে নাম 'Unknown' দেখাবে
                $studentName = optional($enrollment->user)->name ?? 'Unknown Student';
                $courseTitle = optional($enrollment->course)->title ?? 'Unknown Course';

                // লগ তৈরি করা (যদি টেবিল থাকে এবং মডেল কাজ করে)
                try {
                    ActivityLog::create([
                        'action' => 'deleted_enrollment',
                        'description' => "Deleted enrollment ID #{$id} for student {$studentName} in course {$courseTitle}",
                        'performed_by' => Auth::id(),
                        'data' => json_encode($enrollment->toArray())
                    ]);
                } catch (\Exception $logEx) {
                    // লগ তৈরিতে সমস্যা হলে ইগনোর করুন, যাতে মেইন ডিলিট আটক না যায়
                    Log::error('Activity Log Creation Failed: ' . $logEx->getMessage());
                }

                // সার্ভিস দিয়ে এনরোলমেন্ট ডিলিট করা
                $this->enrollmentService->deleteEnrollment($id);
                
                return redirect(route('enrollments.index'))->with('success', 'Enrollment is successfully deleted');
            } else {
                return redirect(route('enrollments.index'))->with('error', 'Enrollment not found.');
            }

        } catch (\Exception $e) {
            Log::error('Enrollment Delete Error: ' . $e->getMessage());
            return redirect(route('enrollments.index'))->with('error', 'Failed to delete enrollment. Error: ' . $e->getMessage());
        }
    }

    /**
     * Bulk Enrollment Logic Updated for PaymentHistory Table
     */
    public function bulkEnroll(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'file' => 'required|mimes:xlsx,xls,csv',
        ]);

        try {
            $courseId = $request->course_id;
            $file = $request->file('file');

            $rows = Excel::toArray([], $file)[0] ?? [];
            
            if (empty($rows)) {
                return response()->json(['message' => 'The uploaded file is empty.'], 400);
            }

            $header = array_shift($rows); 

            $failedRows = [];
            $successCount = 0;
            $currentUserId = Auth::id();

            foreach ($rows as $row) {
                $phone = $row[1] ?? null;
                $email = $row[2] ?? null;
                
                $amount = isset($row[3]) && is_numeric($row[3]) ? (float)$row[3] : 0;
                $method = $row[4] ?? null;
                $trxid = $row[5] ?? null;

                if(!$email && !$phone) {
                    $failedRows[] = array_merge($row, ['Email or Phone missing']);
                    continue;
                }

                $student = null;
                if ($email) $student = User::where('email', $email)->first();
                if (!$student && $phone) $student = User::where('phone', $phone)->first();

                if (!$student) {
                    $failedRows[] = array_merge($row, ['Student not found']);
                    continue;
                }

                $exists = CourseEnrollment::where('course_id', $courseId)
                            ->where('user_id', $student->id)
                            ->exists();

                if ($exists) {
                    $failedRows[] = array_merge($row, ['Already enrolled']);
                    continue;
                }

                if ($amount > 0 || !empty($trxid)) {
                    $enrollmentType = 'paid';
                    if (empty($method)) $method = 'manual';
                } else {
                    $enrollmentType = 'free';
                    $amount = 0; 
                    $method = null;
                }

                CourseEnrollment::create([
                    'course_id' => $courseId,
                    'user_id' => $student->id,
                    'enrollment_type' => $enrollmentType,
                    'enrolled_by' => $currentUserId,
                    'entry_date' => now(),
                ]);

                if ($amount > 0) {
                    PaymentHistory::create([
                        'user_id' => $student->id,
                        'created_by' => $currentUserId,
                        'course_id' => $courseId,
                        'amount' => $amount,
                        'payment_type' => $method,
                        'transaction_id' => $trxid,
                        'invoice' => 'BULK-' . strtoupper(Str::random(8)),
                        'admin_revenue' => $amount,
                        'instructor_revenue' => 0,
                        'tax' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $successCount++;
            }

            if (count($failedRows) > 0) {
                array_unshift($failedRows, ['name', 'phone', 'email', 'paid_amount', 'payment_method', 'trxid', 'error_reason']);
                
                $message = "$successCount students enrolled successfully!";
                
                if (ob_get_contents()) ob_end_clean();

                return Excel::download(new EnrollmentErrorExport($failedRows), 'enrollment_errors.xlsx', \Maatwebsite\Excel\Excel::XLSX, [
                    'Access-Control-Expose-Headers' => 'X-Message',
                    'X-Message' => $message,
                ]);
            }

            return response()->json([
                'message' => "All $successCount students enrolled successfully!",
                'status' => 'success'
            ]);

        } catch (\Throwable $th) {
            return response()->json([
                'message' => 'Server Error: ' . $th->getMessage(),
                'trace' => $th->getTraceAsString() 
            ], 500);
        }
    }

    public function downloadTemplate()
    {
        $filename = "bulk_enroll_template.csv";
        
        if (ob_get_contents()) ob_end_clean();
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() {
            $df = fopen("php://output", 'w');
            fputcsv($df, ['name', 'phone', 'email', 'paid_amount', 'payment_method', 'trxid']);
            fputcsv($df, ['John Doe', '01700000000', 'john@example.com', '500', 'bkash', 'TRX123456']);
            fputcsv($df, ['Jane Doe', '01800000000', 'jane@example.com', '', '', '']);
            fclose($df);
        };

        return response()->stream($callback, 200, $headers);
    }
}