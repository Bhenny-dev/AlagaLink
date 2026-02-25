<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(AdminUsersSeeder::class);
        $this->call(AlagaLinkSeeder::class);

        if (app()->environment(['local', 'testing'])) {
            User::firstOrCreate(
                ['email' => 'test@example.com'],
                ['name' => 'Test User', 'password' => 'password']
            );

            // Keep a small pool of demo users, but avoid growing unbounded on repeated seeds.
            if (User::count() < 20) {
                User::factory(3)->create();
            }
        }
    }
}
