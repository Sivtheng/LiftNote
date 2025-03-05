<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'height',
        'weight',
        'fitness_goal',
        'medical_condition'
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id')->where('role', 'client');
    }
}
