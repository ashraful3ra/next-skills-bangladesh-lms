<?php

namespace App\Http\Controllers;

use App\Enums\UserType;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    /**
     * Display a listing of the admins.
     */
    public function index(): Response
    {
        // শুধুমাত্র এডমিন রোল এর ইউজারদের খুঁজবে
        $admins = User::where('role', UserType::ADMIN)
            ->latest()
            ->paginate(10)
            ->withQueryString(); // ফিল্টার বা সার্চ থাকলেও পেজিনেশন ঠিক থাকবে

        return Inertia::render('dashboard/admins/index', [
            'admins' => $admins,
        ]);
    }

    /**
     * Store a newly created admin in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'phone'    => 'nullable|string|max:20',
        ]);

        User::create([
            'name'              => $request->name,
            'email'             => $request->email,
            'phone'             => $request->phone,
            'password'          => Hash::make($request->password),
            'role'              => UserType::ADMIN,
            'email_verified_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Admin created successfully.');
    }

    /**
     * Remove the specified admin from storage.
     */
    public function destroy($id): RedirectResponse
    {
        // শুধুমাত্র সেই ইউজারকে খুঁজবে যে এডমিন। এতে ভুল করে সাধারণ ইউজার ডিলিট হওয়ার চান্স নেই।
        $user = User::where('role', UserType::ADMIN)->findOrFail($id);

        // নিজেকে ডিলিট করা রোধ করা
        if (auth()->id() === $user->id) {
            return redirect()->back()->with('error', 'You cannot delete your own account.');
        }

        // ডিলিট করার আগে প্রোফাইল ফটো বা অন্য ফাইল থাকলে তা রিমুভ করার কোড এখানে দিতে পারেন
        $user->delete();

        return redirect()->back()->with('success', 'Admin removed successfully.');
    }
}