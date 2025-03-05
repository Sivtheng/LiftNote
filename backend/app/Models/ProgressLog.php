<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgressLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'client_id',
        'program_id',
        'date'
    ];

    protected $casts = [
        'date' => 'datetime'
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id')->where('role', 'client');
    }

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
}
