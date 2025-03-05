<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Questionnaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'program_id',
        'questions',
        'answers',
        'status'
    ];

    protected $casts = [
        'questions' => 'array',
        'answers' => 'array'
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id')->where('role', 'client');
    }

    public function program()
    {
        return $this->belongsTo(Program::class);
    }
}
