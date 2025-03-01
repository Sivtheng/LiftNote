<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    use HasFactory;

    protected $fillable = [
        'coach_id',
        'program_name',
        'description',
        'program_details',
    ];

    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }
}
