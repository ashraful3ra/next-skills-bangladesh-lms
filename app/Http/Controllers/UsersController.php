<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Models\PaymentHistory;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UsersController extends Controller
{
    public function __construct(protected UserService $userService) {}

    public function index(Request $request)
    {
        $users = $this->userService->getUsers([
            ...$request->all(),
            'paginate' => true,
        ]);

        return Inertia::render('dashboard/users/index', compact('users'));
    }

    public function show($id)
    {
        $user = User::with(['enrollments.course', 'payment_histories.course'])->findOrFail($id);

        $user->enrollments->transform(function ($enrollment) use ($user) {
            $course = $enrollment->course;
            
            if (!$course) {
                $enrollment->payment_info = [
                    'course_title' => 'Unknown Course',
                    'batch_label' => 'N/A',
                    'course_price' => 0,
                    'paid_amount' => 0,
                    'due_amount' => 0,
                    'status' => 'Unknown',
                ];
                return $enrollment;
            }

            $batchLabel = $course->batch_no ? $course->batch_no : 'Main';
            $enrollment->batch_label = $batchLabel;

            // ✅ New Payment Logic for Profile
            $paymentRecords = $user->payment_histories->where('course_id', $course->id);
            
            // Check Flags
            $isRefunded = $paymentRecords->where('is_refunded', 1)->count() > 0;
            $isFullPaid = $paymentRecords->where('is_full_paid', 1)->count() > 0;

            $totalPaid = $paymentRecords->where('is_refunded', 0)->sum('amount');
            $coursePrice = $course->price ?? 0;
            $dueAmount = max(0, $coursePrice - $totalPaid);

            $status = 'Due';
            if ($isRefunded) {
                $status = 'Refunded';
                $dueAmount = 0; // No due if refunded
            } elseif ($isFullPaid || ($dueAmount == 0 && $coursePrice > 0)) {
                $status = 'Paid';
            } elseif ($totalPaid > 0) {
                $status = 'Partial';
            } elseif ($coursePrice == 0) {
                $status = 'Free';
            }

            $enrollment->payment_info = [
                'course_title' => $course->title,
                'batch_label' => $batchLabel,
                'course_price' => $coursePrice,
                'paid_amount' => $totalPaid,
                'due_amount' => $dueAmount,
                'status' => $status,
            ];
            
            return $enrollment;
        });

        return Inertia::render('dashboard/users/show', [
            'student' => $user
        ]);
    }

    public function destroyPaymentHistory($id)
    {
        $payment = PaymentHistory::findOrFail($id);
        $payment->delete();
        return redirect()->back()->with('success', 'Single payment record deleted successfully.');
    }

    public function destroyPayment($userId, $courseId)
    {
        PaymentHistory::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->delete();
        return redirect()->back()->with('success', 'Payment history cleared for this course.');
    }

    public function update(UpdateUserRequest $request, string $id)
    {
        $user = User::findOrFail($id);
        $data = $request->validated();

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);
        return redirect()->back()->with('success', 'User updated successfully');
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        if (isAdmin()) {
            User::find($id)->delete();
            return redirect()->back()->with('success', 'User account deleted successfully');
        }

        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();
        Auth::logout();
        $user->delete();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}