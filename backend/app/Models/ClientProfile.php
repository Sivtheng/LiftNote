<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'body_details',
        'workout_goals',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
}
