<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CoachSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('coaches')->insert([
            'name' => 'rithy',
            'email' => 'rithyphal@example.com',
            'password' => Hash::make('rithy'),
            'profile_image' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
