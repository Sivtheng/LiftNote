<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProgramWeek extends Model
{
    protected $fillable = [
        'program_id',
        'name',
        'order'
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function days(): HasMany
    {
        return $this->hasMany(ProgramDay::class, 'week_id');
    }
} 