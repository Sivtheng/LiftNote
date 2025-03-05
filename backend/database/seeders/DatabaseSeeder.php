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
        ]);

        // Create Coach User
        User::create([
            'name' => 'Coach User',
            'email' => 'coach@liftnote.com',
            'password' => Hash::make('password'),
            'role' => 'coach',
        ]);
    }
}
