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
    public function initiate()
    {
        // Ekhane 'initiator' relation load kora hoyeche jate dekha jay ke initiate koreche
        $refunds = Refund::where('status', 'initiated')
            ->with(['user', 'course', 'initiator']) 
            ->latest()
            ->get();

        return Inertia::render('dashboard/refunds/initiate', compact('refunds'));
    }

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

    public function getStudentCourses($userId)
    {
        $enrollments = CourseEnrollment::where('user_id', $userId)
            ->with('course')
            ->get()
            ->map(function ($enroll) {
                $totalPaid = PaymentHistory::where('user_id', $enroll->user_id)
                    ->where('course_id', $enroll->course_id)
                    ->where('is_refunded', 0) // Only count non-refunded amounts
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
            'status' => 'initiated',
            'initiated_by' => auth()->id(), // <-- Notun: Ke initiate korche ta save hocche
        ]);

        return back()->with('success', 'Refund initiated successfully! Link generated.');
    }

    public function pending()
    {
        $refunds = Refund::where('status', 'pending')
            ->with(['user', 'course', 'initiator']) // <-- Initiator relation add kora holo
            ->latest()
            ->get();

        return Inertia::render('dashboard/refunds/pending', compact('refunds'));
    }

    public function approved()
    {
        $refunds = Refund::whereIn('status', ['approved', 'paid'])
            ->with(['user', 'course', 'initiator', 'approver', 'payer']) // <-- Sob relation load kora holo
            ->latest()
            ->get();

        return Inertia::render('dashboard/refunds/approved', compact('refunds'));
    }

    public function showPublicForm($uuid)
    {
        $refund = Refund::where('uuid', $uuid)
            ->where('is_link_used', false)
            ->with(['user', 'course'])
            ->firstOrFail();

        return Inertia::render('public/refund-apply', compact('refund'));
    }

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

        return redirect('/')->with('success', 'Refund application submitted successfully. Please wait for approval.');
    }

    public function approve($id)
    {
        Refund::findOrFail($id)->update([
            'status' => 'approved',
            'approved_by' => auth()->id() // <-- Notun: Ke approve korche ta save hocche
        ]);
        return back()->with('success', 'Refund request approved. Ready for payment.');
    }

    public function markPaid(Request $request, $id)
    {
        $request->validate([
            'payment_proof' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $refund = Refund::findOrFail($id);
        
        $proofPath = null;
        if ($request->hasFile('payment_proof')) {
            $proofPath = $request->file('payment_proof')->store('refunds/proofs', 'public');
        }

        // Optional: Jodi enrollment delete log korte chao, tahole ekhane ActivityLog create koro
        // \App\Models\ActivityLog::create([...]);

        CourseEnrollment::where('user_id', $refund->user_id)
            ->where('course_id', $refund->course_id)
            ->delete();

        // ✅ Update Payment History to Refunded
        PaymentHistory::where('user_id', $refund->user_id)
            ->where('course_id', $refund->course_id)
            ->update([
                'payment_type' => 'refunded',
                'is_refunded' => 1,  // Mark as refunded
                'is_full_paid' => 0  // Not full paid anymore
            ]);

        $refund->update([
            'status' => 'paid',
            'payment_proof' => $proofPath,
            'paid_by' => auth()->id() // <-- Notun: Ke pay korche ta save hocche
        ]);

        return back()->with('success', 'Payment confirmed, refund recorded, and student removed from course.');
    }
}