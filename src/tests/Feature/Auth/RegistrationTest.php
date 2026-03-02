<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertRedirect('/?section=signup');
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertGuest();
        $response
            ->assertRedirect('/?section=login')
            ->assertSessionHas('status', 'Account created. Please log in.');
    }

    public function test_pwd_users_can_register_with_prefilled_profile(): void
    {
        $response = $this->post('/register', [
            'account_type' => 'pwd',
            'alagalink_role' => 'User',
            'first_name' => 'Juan',
            'middle_name' => 'Santos',
            'last_name' => 'Dela Cruz',
            'name' => 'Juan Santos Dela Cruz',
            'email' => 'pwd@example.com',
            'contact_number' => '09171234567',
            'address' => 'La Trinidad, Benguet',
            'birth_date' => '2000-01-01',
            'sex' => 'Male',
            'blood_type' => 'O+',
            'disability_category' => 'Autism',
            'emergency_contact_name' => 'Maria Dela Cruz',
            'emergency_contact_relation' => 'Mother',
            'emergency_contact_number' => '09991234567',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertGuest();
        $response
            ->assertRedirect('/?section=login')
            ->assertSessionHas('status', 'Account created. Please log in.');

        $user = User::query()->where('email', 'pwd@example.com')->first();
        $this->assertNotNull($user);
        $this->assertSame('User', $user->alagalink_role);
        $this->assertSame('2000-01-01', $user->alagalink_data['birthDate'] ?? null);
        $this->assertSame('Male', $user->alagalink_data['sex'] ?? null);
        $this->assertSame('O+', $user->alagalink_data['bloodType'] ?? null);
        $this->assertSame('Maria Dela Cruz', $user->alagalink_data['emergencyContact']['name'] ?? null);
        $this->assertSame('Mother', $user->alagalink_data['emergencyContact']['relation'] ?? null);
        $this->assertSame('09991234567', $user->alagalink_data['emergencyContact']['contact'] ?? null);
        $this->assertGreaterThanOrEqual(1, (int) ($user->alagalink_data['age'] ?? 0));
    }

    public function test_staff_users_can_register_with_prefilled_profile(): void
    {
        $response = $this->post('/register', [
            'account_type' => 'staff',
            'alagalink_role' => 'Admin',
            'first_name' => 'Ana',
            'last_name' => 'Reyes',
            'name' => 'Ana Reyes',
            'email' => 'staff@example.com',
            'contact_number' => '09170000000',
            'address' => 'La Trinidad, Benguet',
            'birth_date' => '1995-05-10',
            'sex' => 'Female',
            'blood_type' => 'A+',
            'staff_office' => 'PDAO',
            'staff_position' => 'Clerk',
            'emergency_contact_name' => 'Pedro Reyes',
            'emergency_contact_relation' => 'Spouse',
            'emergency_contact_number' => '09990000000',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertGuest();
        $response
            ->assertRedirect('/?section=login')
            ->assertSessionHas('status', 'Account created. Please log in.');

        $user = User::query()->where('email', 'staff@example.com')->first();
        $this->assertNotNull($user);
        $this->assertSame('Admin', $user->alagalink_role);
        $this->assertSame('N/A (Staff/Admin)', $user->alagalink_data['disabilityCategory'] ?? null);
        $this->assertSame('PDAO Staff', $user->alagalink_data['registrantType'] ?? null);
        $this->assertSame('PDAO', $user->alagalink_data['customData']['staffOffice'] ?? null);
        $this->assertSame('Clerk', $user->alagalink_data['customData']['staffPosition'] ?? null);
    }
}
