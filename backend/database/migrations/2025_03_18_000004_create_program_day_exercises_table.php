<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('program_day_exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_day_id')->constrained()->onDelete('cascade');
            $table->foreignId('exercise_id')->constrained()->onDelete('cascade');
            $table->json('target_types');
            $table->json('values');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('program_day_exercises');
    }
}; 