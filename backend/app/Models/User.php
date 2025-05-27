<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone_number',
        'bio',
        'profile_picture',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isCoach(): bool
    {
        return $this->role === 'coach';
    }

    public function isClient(): bool
    {
        return $this->role === 'client';
    }

    public function programs(): HasMany
    {
        return $this->hasMany(Program::class, 'coach_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function progressLogs(): HasMany
    {
        return $this->hasMany(ProgressLog::class, 'user_id');
    }

    public function questionnaire(): HasOne
    {
        return $this->hasOne(Questionnaire::class, 'client_id');
    }

    public function current_program()
    {
        return $this->hasOne(Program::class, 'client_id')
            ->where('status', 'active')
            ->latest();
    }

    public function createdExercises()
    {
        return $this->hasMany(Exercise::class, 'created_by');
    }
} 