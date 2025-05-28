<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgressLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_id',
        'user_id',
        'exercise_id',
        'week_id',
        'day_id',
        'weight',
        'reps',
        'time_seconds',
        'rpe',
        'completed_at',
        'workout_duration',
        'is_rest_day'
    ];

    protected $casts = [
        'completed_at' => 'datetime',
        'weight' => 'decimal:2',
        'workout_duration' => 'integer',
        'is_rest_day' => 'boolean'
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }

    public function week(): BelongsTo
    {
        return $this->belongsTo(ProgramWeek::class, 'week_id');
    }

    public function day(): BelongsTo
    {
        return $this->belongsTo(ProgramDay::class, 'day_id');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
}
