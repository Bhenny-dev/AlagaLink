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
                'alagalink_id' => 'ADM-LT-1001',
                'name' => 'Joe B. Kis-ing',
                'email' => 'joe.kising@alagalink.ph',
                'password' => 'password',
                'alagalink_role' => 'SuperAdmin',
                'sex' => 'Male',
                'photoUrl' => 'https://randomuser.me/api/portraits/men/32.jpg',
            ],
            [
                'alagalink_id' => 'ADM-LT-1002',
                'name' => 'Cynthia P. Cabigat',
                'email' => 'cynthia.cabigat@alagalink.ph',
                'password' => 'password',
                'alagalink_role' => 'Admin',
                'sex' => 'Female',
                'photoUrl' => 'https://randomuser.me/api/portraits/women/44.jpg',
            ],
            [
                'alagalink_id' => 'ADM-LT-1003',
                'name' => 'Nikki Rose B. Ibayan',
                'email' => 'nikki.ibayan@alagalink.ph',
                'password' => 'password',
                'alagalink_role' => 'Admin',
                'sex' => 'Female',
                'photoUrl' => 'https://randomuser.me/api/portraits/women/65.jpg',
            ],
            [
                'alagalink_id' => 'ADM-LT-1004',
                'name' => 'Kenneth Wallac',
                'email' => 'kenneth.wallac@alagalink.ph',
                'password' => 'password',
                'alagalink_role' => 'Admin',
                'sex' => 'Male',
                'photoUrl' => 'https://randomuser.me/api/portraits/men/12.jpg',
            ],
        ];

        foreach ($users as $user) {
            $nameParts = preg_split('/\s+/', trim((string) ($user['name'] ?? '')));
            $nameParts = array_values(array_filter($nameParts ?: []));
            $firstName = $nameParts[0] ?? 'Admin';
            $lastName = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : '';

            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    // `password` is cast to "hashed" on the User model.
                    'password' => $user['password'],
                    'alagalink_id' => $user['alagalink_id'],
                    'alagalink_role' => $user['alagalink_role'],
                    'alagalink_status' => 'Active',
                    'alagalink_data' => [
                        'id' => $user['alagalink_id'],
                        'email' => $user['email'],
                        'role' => $user['alagalink_role'],
                        'firstName' => $firstName,
                        'lastName' => $lastName,
                        'middleName' => '',
                        'address' => '',
                        'birthDate' => '',
                        'provincialAddress' => '',
                        'civilStatus' => '',
                        'occupation' => '',
                        'sex' => $user['sex'] ?? 'Other',
                        'bloodType' => '',
                        'age' => 0,
                        'contactNumber' => '',
                        'disabilityCategory' => 'N/A (Staff/Admin)',
                        'familyComposition' => [],
                        'emergencyContact' => [
                            'name' => '',
                            'relation' => '',
                            'contact' => '',
                        ],
                        'registrantType' => 'PDAO Staff',
                        'status' => 'Active',
                        'photoUrl' => $user['photoUrl'] ?? '',
                        'customData' => (object) [],
                        'history' => [
                            'lostAndFound' => [],
                            'programs' => [],
                        ],
                    ],
                ]
            );
        }
    }
}
