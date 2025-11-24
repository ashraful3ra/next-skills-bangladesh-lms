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
use Inertia\Inertia;

class UsersController extends Controller
{
    public function __construct(protected UserService $userService) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $users = $this->userService->getUsers([
            ...$request->all(),
            'paginate' => true,
        ]);

        return Inertia::render('dashboard/users/index', compact('users'));
    }

    /**
     * Show the student profile with enrollments and payment info
     */
    public function show($id)
    {
        $user = User::with(['enrollments.course', 'payment_histories.course'])->findOrFail($id);

        // Payment Summary Processing (Course wise)
        $user->enrollments->transform(function ($enrollment) use ($user) {
            $course = $enrollment->course;
            
            if (!$course) {
                $enrollment->payment_info = [
                    'course_title' => 'Unknown Course',
                    'course_price' => 0,
                    'paid_amount' => 0,
                    'due_amount' => 0,
                    'status' => 'Unknown',
                ];
                return $enrollment;
            }

            // Calculate Total Paid for this specific course
            $totalPaid = $user->payment_histories
                ->where('course_id', $course->id)
                ->sum('amount');

            $coursePrice = $course->price ?? 0;
            $dueAmount = max(0, $coursePrice - $totalPaid);

            $status = 'Due';
            if ($dueAmount == 0 && $coursePrice > 0) {
                $status = 'Paid';
            } elseif ($totalPaid > 0) {
                $status = 'Partial';
            } elseif ($coursePrice == 0) {
                $status = 'Free';
            }

            $enrollment->payment_info = [
                'course_title' => $course->title,
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

    /**
     * ✅ New Method: Delete a SINGLE payment history record
     */
    public function destroyPaymentHistory($id)
    {
        $payment = PaymentHistory::findOrFail($id);
        $payment->delete();

        return redirect()->back()->with('success', 'Single payment record deleted successfully.');
    }

    /**
     * Update the user's account.
     */
    public function update(UpdateUserRequest $request, string $id)
    {
        $this->userService->updateUser($id, $request->validated());

        return redirect()->back()->with('success', 'User updated successfully');
    }

    /**
     * Delete the user's account.
     */
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