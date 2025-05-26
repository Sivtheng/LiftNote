<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ClientSeeder extends Seeder
{
    public function run()
    {
        $clients = [
            [
                'name' => 'John Smith',
                'email' => 'john.smith@example.com',
                'password' => Hash::make('password123'),
                'role' => 'client',
                'phone_number' => '+1234567890',
                'bio' => 'Fitness enthusiast looking to improve overall strength and endurance.'
            ],
            [
                'name' => 'Sarah Johnson',
                'email' => 'sarah.j@example.com',
                'password' => Hash::make('password123'),
                'role' => 'client',
                'phone_number' => '+1987654321',
                'bio' => 'Working on weight loss and muscle toning goals.'
            ],
            [
                'name' => 'Mike Wilson',
                'email' => 'mike.w@example.com',
                'password' => Hash::make('password123'),
                'role' => 'client',
                'phone_number' => '+1122334455',
                'bio' => 'Training for a marathon, focusing on endurance and stamina.'
            ],
            [
                'name' => 'Emma Davis',
                'email' => 'emma.d@example.com',
                'password' => Hash::make('password123'),
                'role' => 'client',
                'phone_number' => '+1555666777',
                'bio' => 'Looking to build muscle mass and improve strength.'
            ],
            [
                'name' => 'David Brown',
                'email' => 'david.b@example.com',
                'password' => Hash::make('password123'),
                'role' => 'client',
                'phone_number' => '+1888999000',
                'bio' => 'Recovering from injury, focusing on rehabilitation exercises.'
            ]
        ];

        foreach ($clients as $client) {
            User::create($client);
        }
    }
} 