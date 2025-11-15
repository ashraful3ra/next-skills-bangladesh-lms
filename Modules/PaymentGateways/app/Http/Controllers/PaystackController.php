<?php

namespace Modules\PaymentGateways\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\Course\CourseCartService;
use App\Services\Course\CourseCouponService;
use App\Services\Payment\PaymentService;
use App\Services\SettingsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

class PaystackController extends Controller
{
    private $paystack;
    private $paystackPublicKey;
    private $paystackSecretKey;

    public function __construct(
        private CourseCouponService $couponService,
        private CourseCartService $cartService,
        private SettingsService $settingsService,
        private PaymentService $paymentService
    ) {
        $this->paystack = $this->settingsService->getSetting(['type' => 'payment', 'sub_type' => 'paystack']);
        $this->paystackPublicKey = $this->paystack->fields['test_mode'] ? $this->paystack->fields['test_public_key'] : $this->paystack->fields['live_public_key'];
        $this->paystackSecretKey = $this->paystack->fields['test_mode'] ? $this->paystack->fields['test_secret_key'] : $this->paystack->fields['live_secret_key'];
    }

    public function paystack_redirect(Request $request)
    {
        $user = Auth::user();

        $coupon = $this->couponService->getCoupon($request->coupon);
        $cart = $this->cartService->getCartItems($user->id);
        $calculatedCart = $this->cartService->calculateCart($cart, $coupon);

        // Convert USD to Paystack currency (ZAR)
        $convertedPrice = $this->convertCurrency($calculatedCart['totalPrice'], 'USD', 'ZAR');

        session()->put('slug', $request->slug);
        session()->put('taxAmount', $calculatedCart['taxAmount']);
        session()->put('couponCode', $coupon ? $coupon->code : null);
        session()->put('originalPrice', $calculatedCart['totalPrice']); // Store original USD price

        return view('paymentgateways::gateways.paystack', [
            'user' => $user,
            'price' => $convertedPrice, // Use converted ZAR price
            'paystackPublicKey' => $this->paystackPublicKey,
        ]);
    }

    public function verify_transaction(Request $request)
    {
        $slug = session()->get('slug');
        $taxAmount = session()->get('taxAmount');
        $couponCode = session()->get('couponCode');
        $originalPrice = session()->get('originalPrice'); // Get original USD price

        try {
            $reference = $request->reference;
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->paystackSecretKey
            ])->get("https://api.paystack.co/transaction/verify/$reference");

            $payment = json_decode($response);

            if ($payment->status == true) {
                // Use original USD price for consistency in the system
                $this->paymentService->coursesBuy('paystack', $payment->data->id, $taxAmount, $originalPrice, $couponCode);

                // Clear session data
                session()->forget(['taxAmount', 'couponCode', 'originalPrice']);

                if ($slug == 'api') {
                    return redirect()->to(env('FRONTEND_URL') . '/student');
                } else {
                    return redirect()->route('student.index', ['tab' => 'courses'])->with('success', 'Congratulation! Your payment have completed');
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

    /**
     * Convert currency from one to another
     * 
     * @param float $amount
     * @param string $fromCurrency
     * @param string $toCurrency
     * @return float
     */
    private function convertCurrency($amount, $fromCurrency, $toCurrency)
    {
        // If same currency, no conversion needed
        if ($fromCurrency === $toCurrency) {
            return round($amount, 2);
        }

        // Define exchange rates (you can move this to settings or use API)
        $exchangeRates = [
            'USD_TO_ZAR' => 18.50, // 1 USD = 18.50 ZAR (update this regularly)
            'USD_TO_NGN' => 1520.00, // 1 USD = 1520 NGN
            'USD_TO_GHS' => 15.80, // 1 USD = 15.80 GHS
            'USD_TO_KES' => 128.00, // 1 USD = 128 KES
            // Add more rates as needed
        ];

        $rateKey = $fromCurrency . '_TO_' . $toCurrency;

        if (isset($exchangeRates[$rateKey])) {
            return round($amount * $exchangeRates[$rateKey], 2);
        }

        // If no rate found, return original amount
        return round($amount, 2);
    }
}
