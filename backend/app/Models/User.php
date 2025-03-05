<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

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

    // Role checking methods
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isCoach()
    {
        return $this->role === 'coach';
    }

    public function isClient()
    {
        return $this->role === 'client';
    }

    // Relationships
    public function programs()
    {
        return $this->hasMany(Program::class, 'coach_id');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function progressLogs()
    {
        return $this->hasMany(ProgressLog::class, 'client_id');
    }

    public function clientProfile()
    {
        return $this->hasOne(ClientProfile::class, 'client_id');
    }
} 