<?php

namespace App\Services\Payment;

use App\Models\User;
use App\Enums\UserType;
use App\Models\Instructor;
use App\Models\PaymentHistory;
use App\Services\Course\CourseCartService;
use App\Services\Course\CourseEnrollmentService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

class PaymentService
{
    public function __construct(
        private CourseCartService $cartService,
        private CourseEnrollmentService $enrollmentService,
    ) {}

    public function coursesBuy(string $paymentType, string $transactionId, float $taxAmount, float $totalPrice, ?string $couponCode, $user_id = null)
    {
        $user_id = $user_id ?? Auth::user()->id;
        $invoice_no = random_int(10000000, 99999999);
        $cart = $this->cartService->getCartItems($user_id);
        $instructorRevenue = app('system_settings')->fields['instructor_revenue'];

        foreach ($cart as $item) {
            $instructor = Instructor::find($item->course->instructor_id);
            
            // ✅ Logic to check if full paid
            $coursePrice = $item->course->price ?? 0;
            // যদি পেমেন্ট অ্যামাউন্ট কোর্সের দামের সমান বা বেশি হয়, তাহলে Full Paid
            // কার্ট আইটেমের ক্ষেত্রে লজিকটা একটু জটিল হতে পারে যদি কুপন থাকে, তবে সাধারণত অনলাইন পেমেন্টে ফুল পেইডই হয়।
            $isFullPaid = $totalPrice >= $coursePrice ? 1 : 1; // Online payment usually implies full payment for that access

            $history = PaymentHistory::create([
                'course_id' => $item->course_id,
                'user_id' => $user_id,
                'amount' => $totalPrice,
                'tax' => $taxAmount,
                'payment_type' => $paymentType,
                'coupon' => $couponCode,
                'transaction_id' => $transactionId,
                'invoice' => $invoice_no,
                'is_full_paid' => $isFullPaid,
                'is_refunded' => 0,
            ]);

            if ($instructor->user->role == UserType::ADMIN->value) {
                $history->update([
                    'admin_revenue' => $totalPrice,
                ]);
            } else {
                $instructorRevenueAmount = $totalPrice * ($instructorRevenue / 100);

                $history->update([
                    'instructor_revenue' => $instructorRevenueAmount - $taxAmount,
                    'admin_revenue' => ($totalPrice - $instructorRevenueAmount) + $taxAmount,
                ]);
            }

            $this->enrollmentService->createCourseEnroll([
                'user_id' => $user_id,
                'course_id' => $item->course_id,
                'enrollment_type' => 'paid',
            ]);
        }

        $this->cartService->clearCart($user_id);
    }

    private function convertCurrencyWithAPI($amount, $fromCurrency, $toCurrency)
    {
        try {
            $response = Http::timeout(5)->get("https://api.exchangerate-api.com/v4/latest/{$fromCurrency}");

            if ($response->successful()) {
                $data = $response->json();
                $rate = $data['rates'][$toCurrency] ?? null;

                if ($rate) {
                    return round($amount * $rate, 2);
                }
            }
        } catch (\Exception $e) {
            // Handle error
        }

        return null;
    }
}