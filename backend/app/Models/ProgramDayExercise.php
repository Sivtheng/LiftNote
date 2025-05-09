<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramDayExercise extends Model
{
    protected $fillable = [
        'program_day_id',
        'exercise_id',
        'target_types',
        'values'
    ];

    protected $casts = [
        'target_types' => 'array',
        'values' => 'array'
    ];

    public function day()
    {
        return $this->belongsTo(ProgramDay::class, 'program_day_id');
    }

    public function exercise()
    {
        return $this->belongsTo(Exercise::class);
    }
} 