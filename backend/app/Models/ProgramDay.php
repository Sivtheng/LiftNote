<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProgramDay extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'order',
        'week_id'
    ];

    public function week(): BelongsTo
    {
        return $this->belongsTo(ProgramWeek::class);
    }

    public function exercises(): BelongsToMany
    {
        return $this->belongsToMany(Exercise::class, 'program_day_exercises')
            ->withPivot([
                'sets',
                'reps',
                'time_seconds',
                'measurement_type',
                'measurement_value'
            ]);
    }

    public function progressLogs(): HasMany
    {
        return $this->hasMany(ProgressLog::class, 'day_id');
    }
}
