<?php

namespace App\Services\Course;

use App\Models\Course\CourseCoupon;

class CourseCouponService
{
   public function getCoupon(?string $code): ?CourseCoupon
   {
      return $code ? CourseCoupon::where('code', $code)->first() : null;
   }

   public function applyCoupon(CourseCoupon $coupon, float $totalPrice): float
   {
      return $totalPrice - ($totalPrice * $coupon->discount / 100);
   }

   public function isCouponValid(CourseCoupon $coupon): bool
   {
      return $coupon->status && (time() >= $coupon->expiry);
   }

   public function getValidCoupon(string $code): ?CourseCoupon
   {
      if (empty($code)) {
         return null;
      }

      $coupon = $this->getCoupon($code);

      if (!$coupon || !$this->isCouponValid($coupon)) {
         return null;
      }

      return $coupon;
   }
}
