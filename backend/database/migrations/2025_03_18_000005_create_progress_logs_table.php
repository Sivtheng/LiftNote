<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('progress_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('exercise_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('week_id')->constrained('program_weeks')->onDelete('cascade');
            $table->foreignId('day_id')->constrained('program_days')->onDelete('cascade');
            $table->decimal('weight', 8, 2)->nullable();
            $table->integer('reps')->nullable();
            $table->integer('time_seconds')->nullable();
            $table->integer('rpe')->nullable();
            $table->integer('workout_duration')->nullable();
            $table->boolean('is_rest_day')->default(false);
            $table->timestamp('completed_at');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('progress_logs');
    }
}; 