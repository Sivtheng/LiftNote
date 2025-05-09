<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramWeek extends Model
{
    protected $fillable = [
        'program_id',
        'name',
        'order'
    ];

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function days()
    {
        return $this->hasMany(ProgramDay::class, 'week_id')->orderBy('order');
    }
} 