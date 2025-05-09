<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramDay extends Model
{
    protected $fillable = [
        'week_id',
        'name',
        'order'
    ];

    public function week()
    {
        return $this->belongsTo(ProgramWeek::class, 'week_id');
    }

    public function exercises()
    {
        return $this->belongsToMany(Exercise::class, 'program_day_exercises')
            ->withPivot('target_types', 'values')
            ->withTimestamps();
    }
} 