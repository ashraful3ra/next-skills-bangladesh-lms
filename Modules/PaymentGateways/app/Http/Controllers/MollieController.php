<?php

namespace Modules\PaymentGateways\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Services\Course\CourseCartService;
use App\Services\Course\CourseCouponService;
use App\Services\Payment\PaymentService;
use App\Services\SettingsService;
use Illuminate\Support\Facades\Auth;
use Mollie\Laravel\Facades\Mollie;


class MollieController extends Controller
{
    private $mollie;
    private $mollieSecret;

    public function __construct(
        private CourseCouponService $couponService,
        private CourseCartService $cartService,
        private SettingsService $settingsService,
        private PaymentService $paymentService
    ) {
        $this->mollie = $this->settingsService->getSetting(['type' => 'payment', 'sub_type' => 'mollie']);
        $this->mollieSecret = $this->mollie->fields['test_mode'] ? $this->mollie->fields['test_api_key'] : $this->mollie->fields['live_api_key'];
    }

    public function payment(Request $request)
    {
        $cart = $this->cartService->getCartItems(Auth::user()->id);
        $coupon = $this->couponService->getCoupon($request->coupon);
        $calculatedCart = $this->cartService->calculateCart($cart, $coupon);

        Mollie::api()->setApiKey($this->mollieSecret);
        $payment = Mollie::api()->payments->create([
            "amount" => [
                "currency" => $this->mollie->fields['currency'],
                "value" =>  number_format($calculatedCart['totalPrice'], 2, '.', '') // You must send the correct number of decimals, thus we enforce the use of strings
            ],
            "description" => "Order #12345",
            "redirectUrl" => route('payments.mollie.success'),
            // "webhookUrl" => route('webhooks.mollie'),
            "metadata" => [
                "order_id" => "12345",
            ],
        ]);

        session()->put('slug', $request->slug);
        session()->put('mollie_id', $payment->id);
        session()->put('taxAmount', $calculatedCart['taxAmount']);
        session()->put('couponCode', $coupon ? $coupon->code : null);

        // redirect customer to Mollie checkout page
        return redirect($payment->getCheckoutUrl(), 303);
    }


    public function success(Request $request)
    {
        $slug = session()->get('slug');
        $mollie_id = session()->get('mollie_id');
        $taxAmount = session()->get('taxAmount');
        $couponCode = session()->get('couponCode');

        try {
            Mollie::api()->setApiKey($this->mollieSecret);
            $payment = Mollie::api()->payments->get($mollie_id);

            if ($payment->isPaid()) {
                $this->paymentService->coursesBuy('mollie', $payment->id, $taxAmount, $payment->amount->value, $couponCode);

                if ($slug == 'api') {
                    return redirect()->to(env('FRONTEND_URL') . '/student');
                } else {
                    return redirect()
                        ->route('student.index', ['tab' => 'courses'])
                        ->with('success', 'Congratulation! Your payment have completed');
                }
            } else {
                return redirect()
                    ->route('payments.index', ['slug' => $slug])
                    ->with('error', 'Your payment have failed, please try again later.');
            }
        } catch (\Throwable $th) {
            return redirect()
                ->route('payments.index', ['slug' => $slug])
                ->with('error', $th->getMessage());
        }
    }
}
