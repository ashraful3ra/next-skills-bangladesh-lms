<?php

namespace App\Http\Controllers;

use App\Enums\UserType;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class AdminController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // শুধুমাত্র এডমিন রোল এর ইউজারদের খুঁজবে
        $admins = User::where('role', UserType::ADMIN)
            ->latest()
            ->paginate(10);

        return Inertia::render('dashboard/admins/index', [
            'admins' => $admins,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'phone' => 'nullable|string|max:20',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => UserType::ADMIN, // রোল হিসেবে এডমিন সেট করা হচ্ছে
            'email_verified_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Admin created successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // নিজেকে ডিলিট করা যাবে না এবং সুপার এডমিন চেক (যদি থাকে)
        if (auth()->id() == $user->id) {
            return redirect()->back()->with('error', 'You cannot delete yourself.');
        }

        $user->delete();

        return redirect()->back()->with('success', 'Admin removed successfully.');
    }
}