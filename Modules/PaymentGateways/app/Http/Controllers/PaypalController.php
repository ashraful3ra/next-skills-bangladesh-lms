<?php

namespace Modules\PaymentGateways\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Services\SettingsService;
use App\Services\Course\CourseCartService;
use App\Services\Course\CourseCouponService;
use App\Services\Payment\PaymentService;
use Illuminate\Support\Facades\Auth;
use Srmklive\PayPal\Services\PayPal as PayPalClient;


class PaypalController extends Controller
{
    private $paypal;

    public function __construct(
        private CourseCouponService $couponService,
        private CourseCartService $cartService,
        private SettingsService $settingsService,
        private PaymentService $paymentService
    ) {
        $this->paypal = $this->settingsService->getSetting(['type' => 'payment', 'sub_type' => 'paypal']);
    }

    // Paypal payment 
    public function payment(Request $request)
    {
        $cart = $this->cartService->getCartItems(Auth::user()->id);
        $coupon = $this->couponService->getCoupon($request->coupon);
        $calculatedCart = $this->cartService->calculateCart($cart, $coupon);

        $config = setPaypalConfig($this->paypal->fields, 'sandbox');

        $provider = new PayPalClient;
        $provider->setApiCredentials($config);
        $accessToken = $provider->getAccessToken();

        $response = $provider->createOrder([
            "intent" => "CAPTURE",
            "application_context" => [
                "return_url" => route('payments.paypal.success'),
                "cancel_url" => route('payments.paypal.cancel'),
            ],
            "purchase_units" => [
                [
                    "amount" => [
                        "currency_code" => strtolower($this->paypal->fields['currency']),
                        "value" => round($calculatedCart['totalPrice'], 2)
                    ]
                ]
            ]
        ]);

        if (isset($response['id']) && $response['id'] != null) {
            session()->put('slug', $request->slug);
            session()->put('taxAmount', $calculatedCart['taxAmount']);
            session()->put('couponCode', $coupon ? $coupon->code : null);

            foreach ($response['links'] as $link) {
                if ($link['rel'] == 'approve') {
                    return redirect()->away($link['href']);
                }
            }
        } else {
            return redirect(route('payments.paypal.cancel'));
        }
    }

    // Paypal payment success
    public function success(Request $request)
    {
        $slug = session()->get('slug');
        $taxAmount = session()->get('taxAmount');
        $couponCode = session()->get('couponCode');

        try {
            $config = setPaypalConfig($this->paypal->fields, 'sandbox');

            $provider = new PayPalClient;
            $provider->setApiCredentials($config);
            $accessToken = $provider->getAccessToken();
            $response = $provider->capturePaymentOrder($request->token);

            if (isset($response['status']) && $response['status'] == 'COMPLETED') {
                $amount = $response['purchase_units'][0]['payments']['captures'][0]['amount']['value'];

                $this->paymentService->coursesBuy('paypal', $response['id'], $taxAmount, $amount, $couponCode);

                session()->forget('taxAmount');
                session()->forget('couponCode');

                if ($slug == 'api') {
                    return redirect()->to(env('FRONTEND_URL') . '/student');
                } else {
                    return redirect()
                        ->route('student.index', ['tab' => 'courses'])
                        ->with('success', 'Congratulation! Your payment have completed');
                }
            } else {
                return redirect(route('payments.paypal.cancel'));
            }
        } catch (\Throwable $th) {
            return redirect()
                ->route('payments.index', ['slug' => $slug])
                ->with('error', $th->getMessage());
        }
    }

    // Paypal payment cancel
    public function cancel()
    {
        $slug = session()->get('slug') ?? 'web';

        return redirect()
            ->route('payments.index', ['slug' => $slug])
            ->with('error', 'Your payment have failed, please try again later.');
    }
}
