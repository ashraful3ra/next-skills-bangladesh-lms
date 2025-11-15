<div class="order-summery">
    <div class="p-6">
        <h2 class="text-lg font-semibold mb-4">{{ __('Item List') }}</h2>
        <div class="space-y-4">
            @foreach($cart as $index => $item)
                <div class="space-y-2">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-2">
                            <span class="text-muted-foreground">#{{ $index + 1 }}</span>
                            <h3 class="font-medium">{{ $item->course->title }}</h3>
                        </div>
                        
                        <div class="text-right flex items-center gap-0.5">
                            <span class="font-semibold">{{ $item->course->discount ? $item->course->discount_price : $item->course->price }}</span>
                            <span>{{ $currency }}</span>
                        </div>
                    </div>
                    @if($index < count($cart) - 1)
                        <div class="h-[1px] w-full bg-border my-2"></div>
                    @endif
                </div>
            @endforeach
        </div>

        <div class="h-[1px] w-full bg-border my-4"></div>

        <div class="space-y-2">
            <div class="flex justify-between">
                <span>{{ __('Total') }}</span>
                <span>{{ $subtotal }} {{ $currency }}</span>
            </div>
            <div class="flex justify-between">
                <span>{{ __('Tax') }}</span>
                <span>+ {{ number_format($taxAmount, 2) }} {{ $currency }}</span>
            </div>

            <div class="h-[1px] w-full bg-border my-2"></div>

            <div class="flex justify-between font-bold">
                <span>{{ __('Grand Total:') }}</span>
                <span>{{ number_format($totalPrice, 2) }} {{ $currency }}</span>
            </div>
        </div>

        <div class="summery-body">
            <div class="body-item flex items-center justify-between mt-5 font-semibold">
                <p class="title">{{__('Pay With')}}</p>
                <p id="paymentMethod">{{__('')}}</p>
            </div>
        </div>
    </div>
</div>