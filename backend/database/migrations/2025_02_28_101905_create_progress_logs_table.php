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
        Schema::create('progress_logs', function (Blueprint $table) {
            $table->id('ProgressLogID');
            $table->foreignId('ClientID')->constrained('clients');
            $table->foreignId('ProgramID')->constrained('programs');
            $table->json('ProgressData')->nullable();
            $table->timestamps(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('progress_logs');
    }
};
