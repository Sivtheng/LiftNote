<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin User
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@liftnote.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'phone_number' => '1234567890',
            'bio' => 'System Administrator',
        ]);

        // Create Coach User
        User::create([
            'name' => 'Coach User',
            'email' => 'coach@liftnote.com',
            'password' => Hash::make('password'),
            'role' => 'coach',
            'phone_number' => '0987654321',
            'bio' => 'Professional Fitness Coach',
        ]);
    }
}
