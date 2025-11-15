<?php

namespace Modules\PaymentGateways\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\Course\CourseCartService;
use App\Services\Course\CourseCouponService;
use App\Services\SettingsService;
use App\Services\StudentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PaymentController extends Controller
{
    public function __construct(
        private CourseCouponService $couponService,
        private CourseCartService $cartService,
        private SettingsService $settingsService,
        private StudentService $studentService
    ) {}

    public function index(Request $request, string $slug)
    {
        $coupon = null;
        if ($request->has('coupon')) {
            $coupon = $this->couponService->getCoupon($request->coupon);
        }

        $cart = $this->cartService->getCartItems(Auth::user()->id);
        $calculatedCart = $this->cartService->calculateCart($cart, $coupon);
        $payments = $this->settingsService->getSettings(['type' => 'payment']);
        $currency = app('system_settings')->fields['selling_currency'] ?? 'USD';

        return view('paymentgateways::index', [
            'slug' => $slug,
            'cart' => $cart,
            'coupon' => $coupon,
            'payments' => $payments,
            'currency' => $currency,
            ...$calculatedCart,
        ]);
    }
}
