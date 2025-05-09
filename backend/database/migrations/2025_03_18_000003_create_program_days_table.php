<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('program_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('week_id')->constrained('program_weeks')->onDelete('cascade');
            $table->string('name');
            $table->integer('order');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('program_days');
    }
}; 