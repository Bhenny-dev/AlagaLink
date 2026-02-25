<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUsersSeeder extends Seeder
{
    /**
     * Seed Super Admin + Admin users.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Joe B. Kis-ing',
                'email' => 'joe.kising@alagalink.ph',
                'password' => 'password',
            ],
            [
                'name' => 'Cynthia P. Cabigat',
                'email' => 'cynthia.cabigat@alagalink.ph',
                'password' => 'password',
            ],
            [
                'name' => 'Nikki Rose B. Ibayan',
                'email' => 'nikki.ibayan@alagalink.ph',
                'password' => 'password',
            ],
            [
                'name' => 'Kenneth Wallac',
                'email' => 'kenneth.wallac@alagalink.ph',
                'password' => 'password',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    // `password` is cast to "hashed" on the User model.
                    'password' => $user['password'],
                ]
            );
        }
    }
}
