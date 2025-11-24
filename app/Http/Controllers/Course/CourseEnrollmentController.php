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
use App\Models\PaymentHistory; // নতুন ইম্পোর্ট
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\EnrollmentErrorExport;
use Illuminate\Support\Str;

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
        // Service handle korbe creation logic (Enrollment + Payment History)
        $this->enrollmentService->createCourseEnroll($request->validated());
        return redirect(route('enrollments.index'))->with('success', 'Enrollment is successfully done in this course');
    }

    public function destroy(string $id)
    {
        try {
            $this->enrollmentService->deleteEnrollment($id);
            return redirect(route('enrollments.index'))->with('success', 'Enrollment is successfully deleted');
        } catch (\Exception $e) {
            return redirect(route('enrollments.index'))->with('error', 'Failed to delete enrollment.');
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

            foreach ($rows as $row) {
                // 0: Name, 1: Phone, 2: Email, 3: Amount, 4: Method, 5: TrxID
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

                // Logic: If amount > 0, type is paid, otherwise free
                if ($amount > 0 || !empty($trxid)) {
                    $enrollmentType = 'paid';
                    if (empty($method)) $method = 'manual';
                } else {
                    $enrollmentType = 'free';
                    $amount = 0; 
                    $method = null;
                }

                // 1. Create Enrollment (Without Payment Data)
                CourseEnrollment::create([
                    'course_id' => $courseId,
                    'user_id' => $student->id,
                    'enrollment_type' => $enrollmentType,
                    'entry_date' => now(),
                ]);

                // 2. Create Payment History (If Amount > 0)
                if ($amount > 0) {
                    PaymentHistory::create([
                        'user_id' => $student->id,
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