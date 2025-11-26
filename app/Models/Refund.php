<?php

namespace App\Models;

use App\Models\Course\Course;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Refund extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function initiator() { return $this->belongsTo(\App\Models\User::class, 'initiated_by'); }
    public function approver() { return $this->belongsTo(\App\Models\User::class, 'approved_by'); }
    public function payer() { return $this->belongsTo(\App\Models\User::class, 'paid_by'); }
}