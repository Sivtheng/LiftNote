<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Program extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'coach_id',
        'client_id',
        'status',
        'total_weeks',
        'completed_weeks',
        'current_week_id',
        'current_day_id'
    ];

    protected $casts = [
        'status' => 'string',
        'total_weeks' => 'integer',
        'completed_weeks' => 'integer'
    ];

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id')->where('role', 'client');
    }

    public function progressLogs(): HasMany
    {
        return $this->hasMany(ProgressLog::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->whereNull('parent_id');
    }

    public function allComments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    // Get all users associated with this program (coach and client)
    public function users()
    {
        return User::whereIn('id', [$this->coach_id, $this->client_id]);
    }

    public function weeks(): HasMany
    {
        return $this->hasMany(ProgramWeek::class)->orderBy('order');
    }

    public function current_week(): BelongsTo
    {
        return $this->belongsTo(ProgramWeek::class, 'current_week_id');
    }

    public function current_day(): BelongsTo
    {
        return $this->belongsTo(ProgramDay::class, 'current_day_id');
    }
}
