<?php

namespace App\Http\Controllers;

use App\Models\Refund;
use App\Models\User;
use App\Models\Course\CourseEnrollment;
use App\Models\PaymentHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class RefundController extends Controller
{
    /**
     * 1. Show Initiate Refund Page (List of initiated refunds)
     */
    public function initiate()
    {
        $refunds = Refund::where('status', 'initiated')
            ->with(['user', 'course'])
            ->latest()
            ->get();

        return Inertia::render('dashboard/refunds/initiate', compact('refunds'));
    }

    /**
     * 2. AJAX: Search Students by Email or Phone
     */
    public function searchStudents(Request $request)
    {
        $query = $request->input('query');
        
        if (empty($query)) {
            return response()->json([]);
        }

        $students = User::where('role', 'student')
            ->where(function($q) use ($query) {
                $q->where('email', 'like', "%{$query}%")
                  ->orWhere('phone', 'like', "%{$query}%");
            })
            ->limit(10)
            ->get(['id', 'name', 'email', 'phone']);

        return response()->json($students);
    }

    /**
     * 3. AJAX: Get Enrolled Courses & Payment Info for a Student
     */
    public function getStudentCourses($userId)
    {
        $enrollments = CourseEnrollment::where('user_id', $userId)
            ->with('course')
            ->get()
            ->map(function ($enroll) {
                $totalPaid = PaymentHistory::where('user_id', $enroll->user_id)
                    ->where('course_id', $enroll->course_id)
                    ->sum('amount');
                
                return [
                    'course_id' => $enroll->course_id,
                    'course_title' => $enroll->course->title,
                    'batch_no' => $enroll->course->batch_no ?? 'N/A',
                    'paid_amount' => $totalPaid
                ];
            });

        return response()->json($enrollments);
    }

    /**
     * 4. Store Initiated Refund & Generate Link
     */
    public function storeInitiate(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'course_id' => 'required|exists:courses,id',
            'total_paid' => 'required|numeric',
            'refund_amount' => 'required|numeric',
            'service_charge_percentage' => 'required|integer',
            'service_charge_amount' => 'required|numeric',
        ]);

        $uuid = Str::uuid();

        Refund::create([
            'uuid' => $uuid,
            'user_id' => $request->user_id,
            'course_id' => $request->course_id,
            'batch_no' => $request->batch_no,
            'total_paid' => $request->total_paid,
            'refund_amount' => $request->refund_amount,
            'service_charge_percentage' => $request->service_charge_percentage,
            'service_charge_amount' => $request->service_charge_amount,
            'status' => 'initiated'
        ]);

        return back()->with('success', 'Refund initiated successfully! Link generated.');
    }

    /**
     * 5. Show Pending Refunds Page (Waiting for admin approval)
     */
    public function pending()
    {
        $refunds = Refund::where('status', 'pending')
            ->with(['user', 'course'])
            ->latest()
            ->get();

        return Inertia::render('dashboard/refunds/pending', compact('refunds'));
    }

    /**
     * 6. Show Approved & Paid Refunds Page
     */
    public function approved()
    {
        $refunds = Refund::whereIn('status', ['approved', 'paid'])
            ->with(['user', 'course'])
            ->latest()
            ->get();

        return Inertia::render('dashboard/refunds/approved', compact('refunds'));
    }

    /**
     * 7. Show Public Refund Application Form (For Student)
     */
    public function showPublicForm($uuid)
    {
        $refund = Refund::where('uuid', $uuid)
            ->where('is_link_used', false)
            ->with(['user', 'course'])
            ->firstOrFail();

        return Inertia::render('public/refund-apply', compact('refund'));
    }

    /**
     * 8. Submit Public Refund Application
     */
    public function submitPublicForm(Request $request, $uuid)
    {
        $refund = Refund::where('uuid', $uuid)->firstOrFail();

        if($refund->is_link_used) {
            return back()->with('error', 'This link has already been used.');
        }

        $request->validate([
            'refund_method' => 'required|string',
            'account_number' => 'required|string',
            'reason' => 'required|string|max:1000',
        ]);

        $refund->update([
            'refund_method' => $request->refund_method,
            'account_number' => $request->account_number,
            'reason' => $request->reason,
            'status' => 'pending',
            'is_link_used' => true
        ]);

        // এখানে চাইলে স্টুডেন্টকে রিডাইরেক্ট করে 'Thank You' পেজে নিতে পারেন
        return redirect('/')->with('success', 'Refund application submitted successfully. Please wait for approval.');
    }

    /**
     * 9. Admin Approves Refund Request
     */
    public function approve($id)
    {
        Refund::findOrFail($id)->update(['status' => 'approved']);
        return back()->with('success', 'Refund request approved. Ready for payment.');
    }

    /**
     * 10. Admin Marks as Paid (Upload Proof, Remove Course, Update History)
     */
    public function markPaid(Request $request, $id)
    {
        $request->validate([
            'payment_proof' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // Max 2MB
        ]);

        $refund = Refund::findOrFail($id);
        
        // 1. Upload Payment Proof Image
        $proofPath = null;
        if ($request->hasFile('payment_proof')) {
            $proofPath = $request->file('payment_proof')->store('refunds/proofs', 'public');
        }

        // 2. Delete Course Enrollment (Remove access)
        CourseEnrollment::where('user_id', $refund->user_id)
            ->where('course_id', $refund->course_id)
            ->delete();

        // 3. Update Payment History (Mark as refunded)
        PaymentHistory::where('user_id', $refund->user_id)
            ->where('course_id', $refund->course_id)
            ->update(['payment_type' => 'refunded']); 

        // 4. Update Refund Status & Save Proof
        $refund->update([
            'status' => 'paid',
            'payment_proof' => $proofPath
        ]);

        return back()->with('success', 'Payment confirmed, proof uploaded, and student removed from course.');
    }
}