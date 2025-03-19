<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionnaireQuestion extends Model
{
    protected $fillable = [
        'key',
        'question',
        'type',
        'options',
        'is_required',
        'order'
    ];

    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean'
    ];
} 