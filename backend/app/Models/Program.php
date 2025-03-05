<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'coach_id',
        'client_id',
        'status'
    ];

    public function coach()
    {
        return $this->belongsTo(User::class, 'coach_id')->where('role', 'coach');
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id')->where('role', 'client');
    }
}
