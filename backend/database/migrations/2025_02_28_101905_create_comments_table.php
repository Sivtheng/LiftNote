<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id('CommentID');
            $table->foreignId('ClientID')->nullable()->constrained('clients');
            $table->foreignId('CoachID')->nullable()->constrained('coaches');
            $table->foreignId('ProgramID')->constrained('programs');
            $table->text('Message');
            $table->timestamps(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
