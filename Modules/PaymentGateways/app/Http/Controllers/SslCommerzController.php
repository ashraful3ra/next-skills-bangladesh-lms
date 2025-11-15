<?php

namespace Modules\PaymentGateways\Http\Controllers;

use App\Models\User;
use App\Models\TempStore;
use Illuminate\Http\Request;
use App\Services\SettingsService;
use App\Services\Course\CourseCartService;
use App\Services\Course\CourseCouponService;
use App\Services\Payment\PaymentService;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Modules\PaymentGateways\Services\SslCommerz\SslCommerzNotification;

class SslCommerzController extends Controller
{
    private $sslcommerz;

    public function __construct(
        private CourseCouponService $couponService,
        private CourseCartService $cartService,
        private SettingsService $settingsService,
        private PaymentService $paymentService
    ) {
        $this->sslcommerz = $this->settingsService->getSetting(['type' => 'payment', 'sub_type' => 'sslcommerz']);
    }

    public function exampleEasyCheckout()
    {
        return view('sslcommerz::exampleEasycheckout');
    }

    public function exampleHostedCheckout(Request $request)
    {
        return view('sslcommerz::exampleHosted', [
            'slug' => $request->slug,
            'coupon' => $request->coupon
        ]);
    }

    public function index(Request $request)
    {
        $request->validate(['phone' => 'required']);

        $user = Auth::user();
        $cart = $this->cartService->getCartItems($user->id);
        $coupon = $this->couponService->getCoupon($request->coupon);
        $calculatedCart = $this->cartService->calculateCart($cart, $coupon);

        $productNames = '';
        $productCategories = '';
        foreach ($cart as $key => $item) {
            $listId = '#' . $key + 1 . ':';
            $productNames = $productNames . $listId . $item->course->title . " ";
            $productCategories = $productCategories . $listId . $item->course->course_category->title . " ";
        }

        $post_data = array();
        $post_data['total_amount'] = round($calculatedCart['totalPrice'], 2); # You cant not pay less than 10
        $post_data['currency'] = $this->sslcommerz->fields['currency']; # "BDT"
        $post_data['tran_id'] = uniqid(); // tran_id must be unique

        # CUSTOMER INFORMATION
        $post_data['cus_name'] = $user->name;
        $post_data['cus_email'] = $user->email;
        $post_data['cus_phone'] = $request->phone;

        $post_data['shipping_method'] = "NO";
        $post_data['product_name'] = $productNames;
        $post_data['product_category'] = $productCategories;
        $post_data['product_profile'] = "online-course";

        $sslc = new SslCommerzNotification();
        # initiate(Transaction Data , false: Redirect to SSLCOMMERZ gateway/ true: Show all the Payement gateway here )
        setTempStore([
            'key' => $post_data['tran_id'],
            'user_id' => $user->id,
            'properties' => [
                'slug' => $request->slug,
                'tax_amount' => $calculatedCart['taxAmount'],
                'coupon_code' =>  $coupon ? $coupon->code : null,
            ]
        ]);

        $payment_options = $sslc->makePayment($post_data, 'hosted');

        if (!is_array($payment_options)) {
            print_r($payment_options);
            $payment_options = array();
        }
    }

    public function success(Request $request)
    {
        $tran_id = $request->input('tran_id');
        $amount = $request->input('amount');
        $currency = $request->input('currency');

        $sslc = new SslCommerzNotification();
        $validation = $sslc->orderValidate($request->all(), $tran_id, $amount, $currency);
        $temp = TempStore::where('key', $tran_id)->first();

        $user_id = $temp->user_id;
        $slug = $temp->properties['slug'];
        $taxAmount = $temp->properties['tax_amount'];
        $couponCode = $temp->properties['coupon_code'];

        if ($validation) {
            $this->paymentService->coursesBuy('sslcommerz', $tran_id, $taxAmount, $amount, $couponCode, $user_id);

            Auth::login(User::find($user_id));
            $temp->delete();

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
                ->with('error', 'Transaction was failed.');
        }
    }

    public function fail(Request $request)
    {
        $tran_id = $request->input('tran_id');

        $temp = TempStore::where('key', $tran_id)->first();
        if ($temp) {
            Auth::login(User::find($temp->user_id));
            $temp->delete();
        }

        return redirect()
            ->route('payments.index')
            ->with('error', 'Payment failed. Please try again or contact support if the problem persists.');
    }

    public function cancel(Request $request)
    {
        $tran_id = $request->input('tran_id');

        $temp = TempStore::where('key', $tran_id)->first();
        if ($temp) {
            Auth::login(User::find($temp->user_id));
            $temp->delete();
        }

        return redirect()
            ->route('payments.index')
            ->with('error', 'Payment was cancelled. You can try again anytime.');
    }

    public function ipn(Request $request)
    {
        #Received all the payement information from the gateway
        if ($request->input('tran_id')) #Check transation id is posted or not.
        {
            $tran_id = $request->input('tran_id');

            $temp = TempStore::where('key', $tran_id)->first();
            if ($temp) {
                Auth::login(User::find($temp->user_id));
                $temp->delete();
            }

            return redirect()
                ->route('payments.index')
                ->with('error', 'Payment processing error. Please try again or contact support.');
        } else {
            return redirect()
                ->route('payments.index')
                ->with('error', 'Invalid payment data received. Please try again.');
        }
    }
}
