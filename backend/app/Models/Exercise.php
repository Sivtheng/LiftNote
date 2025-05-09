<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exercise extends Model
{
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

    public function programDays()
    {
        return $this->belongsToMany(ProgramDay::class, 'program_day_exercises')
            ->withPivot('target_types', 'values')
            ->withTimestamps();
    }
} 