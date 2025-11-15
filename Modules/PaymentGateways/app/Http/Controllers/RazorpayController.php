<?php

namespace Modules\PaymentGateways\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SettingsService;
use App\Http\Controllers\Controller;
use App\Services\Course\CourseCartService;
use App\Services\Course\CourseCouponService;
use App\Services\Payment\PaymentService;
use Illuminate\Support\Facades\Auth;
use Razorpay\Api\Api;

class RazorpayController extends Controller
{
    private $razorpay;

    public function __construct(
        private CourseCouponService $couponService,
        private CourseCartService $cartService,
        private SettingsService $settingsService,
        private PaymentService $paymentService
    ) {
        $this->razorpay = $this->settingsService->getSetting(['type' => 'payment', 'sub_type' => 'razorpay']);
    }

    // Razorpay payment 
    public function index(Request $request)
    {
        $user = Auth::user();
        $cart = $this->cartService->getCartItems(Auth::user()->id);
        $coupon = $this->couponService->getCoupon($request->coupon);
        $calculatedCart = $this->cartService->calculateCart($cart, $coupon);

        $data = array();
        $data['user'] = $user;
        $data['key'] = $this->razorpay->fields['api_key'];
        $data['amount'] = $calculatedCart['totalPrice'];
        $data['currency'] = $this->razorpay->fields['currency'];
        $data['description'] = '';

        foreach ($cart as $key => $item) {
            $listId = '#' . ($key + 1) . ':';
            $data['description'] = $data['description'] . $listId . $item->course->title . " ";
        }

        setTempStore([
            'user_id' => $user->id,
            'properties' => [
                'slug' => $request->slug,
                'tax_amount' => $calculatedCart['taxAmount'],
                'coupon_code' =>  $coupon ? $coupon->code : null,
                'currency' => $data['currency']
            ]
        ]);

        return view('paymentgateways::gateways.razorpay', $data);
    }

    public function payment(Request $request)
    {
        $key = $this->razorpay->fields['api_key'];
        $secret = $this->razorpay->fields['api_secret'];

        $api = new Api($key, $secret);

        $user = Auth::user();
        $temp = getTempStore($user->id);

        $slug = $temp->properties['slug'];
        $taxAmount = $temp->properties['tax_amount'];
        $couponCode = $temp->properties['coupon_code'];

        if ($request->has('razorpay_payment_id') && $request->filled('razorpay_payment_id')) {
            try {
                $payment = $api->payment->fetch($request->razorpay_payment_id);
                $response = $api->payment->fetch($request->razorpay_payment_id)->capture(['amount' => $payment['amount']]);
                $tnxId = $response['id'];

                // Use the actual payment amount from Razorpay response
                $amount = (round($response['amount'] / 100, 2));

                // Fix: Use 'razorpay' instead of 'sslcommerz'
                $this->paymentService->coursesBuy('razorpay', $tnxId, $taxAmount, $amount, $couponCode);
                $temp->delete();

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

        $temp->delete();

        return redirect()
            ->route('payments.index', ['slug' => $slug])
            ->with('error', 'Transaction was failed.');
    }
}
