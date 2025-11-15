<?php

namespace Modules\PaymentGateways\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Services\Course\CourseCartService;
use App\Services\Course\CourseCouponService;
use App\Services\Payment\PaymentService;
use App\Services\SettingsService;
use Illuminate\Support\Facades\Auth;
use Stripe\Checkout\Session;
use Stripe\Stripe;

class StripeController extends Controller
{
    private $stripe;
    private $stripeSecret;

    public function __construct(
        private CourseCouponService $couponService,
        private CourseCartService $cartService,
        private SettingsService $settingsService,
        private PaymentService $paymentService
    ) {
        $this->stripe = $this->settingsService->getSetting(['type' => 'payment', 'sub_type' => 'stripe']);
        $this->stripeSecret = $this->stripe->fields['test_mode'] ? $this->stripe->fields['test_secret_key'] : $this->stripe->fields['live_secret_key'];
    }

    // Stripe payment 
    public function payment(Request $request)
    {
        $cart = $this->cartService->getCartItems(Auth::user()->id);
        $coupon = $this->couponService->getCoupon($request->coupon);
        $calculatedCart = $this->cartService->calculateCart($cart, $coupon);

        Stripe::setApiKey($this->stripeSecret);
        $response = Session::create([
            'line_items' => [
                [
                    'price_data' => [
                        'currency' => strtolower($this->stripe->fields['currency']),
                        'product_data' => [
                            'name' => 'Course Purchase',
                        ],
                        'unit_amount' => round($calculatedCart['totalPrice'] * 100),
                    ],
                    'quantity' => 1,
                ]
            ],
            'mode' => 'payment',
            'success_url' => route('payments.stripe.success'),
            'cancel_url' => route('payments.stripe.cancel'),
        ]);

        session()->put('slug', $request->slug);
        session()->put('stripe_id', $response->id);
        session()->put('taxAmount', $calculatedCart['taxAmount']);
        session()->put('couponCode', $coupon ? $coupon->code : null);

        return redirect()->away($response->url);
    }


    // Stripe payment success
    public function success(Request $request)
    {
        $slug = session()->get('slug');
        $stripe_id = session()->get('stripe_id');
        $taxAmount = session()->get('taxAmount');
        $couponCode = session()->get('couponCode');

        try {
            Stripe::setApiKey($this->stripeSecret);
            $order = Session::retrieve($stripe_id);

            $this->paymentService->coursesBuy('stripe', $order->payment_intent, $taxAmount, ($order->amount_total / 100), $couponCode);
            session()->forget('taxAmount');
            session()->forget('couponCode');

            if ($slug == 'api') {
                return redirect()->to(env('FRONTEND_URL') . '/student');
            } else {
                return redirect()
                    ->route('student.index', ['tab' => 'courses'])
                    ->with('success', 'Congratulation! Your payment have completed');
            }
        } catch (\Throwable $th) {
            return redirect()
                ->route('payments.index', ['slug' => $slug])
                ->with('error', $th->getMessage());
        }
    }


    // Stripe payment cancel
    public function cancel()
    {
        $slug = session()->get('slug');

        return redirect()
            ->route('payments.index', ['slug' => $slug])
            ->with('error', 'Your payment have failed, please try again later.');
    }
}
