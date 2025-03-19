<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('questionnaire_questions', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('question');
            $table->string('type')->default('text'); // text, number, select, etc.
            $table->json('options')->nullable(); // For select/multiple choice questions
            $table->boolean('is_required')->default(true);
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('questionnaire_questions');
    }
}; 