<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Course\Course;
use App\Models\PaymentHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class PaymentHistoryController extends Controller
{
    public function index(Request $request)
    {
        $query = PaymentHistory::with(['user', 'course']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('transaction_id', 'like', '%' . $request->search . '%')
                  ->orWhere('invoice', 'like', '%' . $request->search . '%')
                  ->orWhereHas('user', function ($q) use ($request) {
                      $q->where('name', 'like', '%' . $request->search . '%')
                        ->orWhere('email', 'like', '%' . $request->search . '%')
                        ->orWhere('phone', 'like', '%' . $request->search . '%');
                  });
            });
        }

        $paymentHistories = $query->orderBy('created_at', 'desc')->paginate(10);

        $paymentHistories->getCollection()->transform(function ($history) {
            // ১. রিফান্ড চেক
            if ($history->is_refunded) {
                $history->calculated_status = 'Refunded';
                $history->calculated_due = 0;
                return $history;
            }

            // ২. ফুল পেইড চেক
            if ($history->is_full_paid) {
                $history->calculated_status = 'Paid';
                $history->calculated_due = 0;
                return $history;
            }

            // ৩. ম্যানুয়াল ক্যালকুলেশন
            $coursePrice = $history->course->price ?? 0;
            $totalPaid = PaymentHistory::where('user_id', $history->user_id)
                ->where('course_id', $history->course_id)
                ->where('is_refunded', 0)
                ->sum('amount');

            $due = max(0, $coursePrice - $totalPaid);

            $history->calculated_due = $due;
            $history->calculated_status = $due > 0 ? ($totalPaid > 0 ? 'Partial' : 'Due') : 'Paid';
            
            return $history;
        });

        $courses = Course::select('id', 'title', 'batch_no', 'price')
                    ->where('status', 'approved')
                    ->get();

        return Inertia::render('dashboard/payment-histories/index', [
            'paymentHistories' => $paymentHistories,
            'courses' => $courses,
        ]);
    }

    public function searchStudents(Request $request)
    {
        $query = $request->get('query');

        if (!$query) {
            return response()->json([]);
        }

        $students = User::where('role', 'student')
            ->where(function($q) use ($query) {
                $q->where('email', 'LIKE', "%{$query}%")
                  ->orWhere('phone', 'LIKE', "%{$query}%")
                  ->orWhere('name', 'LIKE', "%{$query}%");
            })
            ->select('id', 'name', 'email', 'phone')
            ->limit(10)
            ->get();

        return response()->json($students);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id', 
            'course_id' => 'required|exists:courses,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
            'transaction_id' => 'nullable|string',
            'coupon_code' => 'nullable|string',
        ]);

        // Check if this payment completes the course price
        $course = Course::find($request->course_id);
        $alreadyPaid = PaymentHistory::where('user_id', $request->user_id)
                        ->where('course_id', $request->course_id)
                        ->where('is_refunded', 0)
                        ->sum('amount');
        
        $newTotal = $alreadyPaid + $request->amount;
        $isFullPaid = ($course && $newTotal >= $course->price) ? 1 : 0;

        PaymentHistory::create([
            'user_id' => $request->user_id,
            'course_id' => $request->course_id,
            'amount' => $request->amount,
            'payment_type' => $request->payment_method,
            'transaction_id' => $request->transaction_id,
            'coupon' => $request->coupon_code,
            'invoice' => 'INV-' . strtoupper(Str::random(8)),
            'admin_revenue' => $request->amount,
            'instructor_revenue' => 0,
            'tax' => 0,
            'is_full_paid' => $isFullPaid, // ✅ Status Set
            'is_refunded' => 0
        ]);

        return redirect()->back()->with('success', 'Payment created successfully.');
    }
}