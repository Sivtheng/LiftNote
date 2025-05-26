<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Exercise extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'video_link',
        'created_by'
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by')->where('role', 'coach');
    }

    public function days(): BelongsToMany
    {
        return $this->belongsToMany(ProgramDay::class, 'program_day_exercises')
            ->withPivot([
                'sets',
                'reps',
                'time_seconds',
                'measurement_type',
                'measurement_value'
            ]);
    }
} 