<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coach extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'password',
        'profile_image',
    ];

    public function programs()
    {
        return $this->hasMany(Program::class);
    }
}