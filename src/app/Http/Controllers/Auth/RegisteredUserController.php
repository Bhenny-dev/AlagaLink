<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AlagaLinkProfile;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $computedName = $request->input('name');
        if (!is_string($computedName) || trim($computedName) === '') {
            $computedName = trim(implode(' ', array_filter([
                (string) $request->input('first_name', ''),
                (string) $request->input('middle_name', ''),
                (string) $request->input('last_name', ''),
            ])));
        }

        $request->merge([
            'name' => $computedName,
        ]);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            // Optional landing-page fields (kept optional for backwards-compatible registration)
            'account_type' => 'nullable|in:pwd,staff',
            'alagalink_role' => 'nullable|in:User,Admin',
            'first_name' => 'nullable|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:64',
            'address' => 'nullable|string|max:255',
            'disability_category' => 'nullable|string|max:255',
            'staff_position' => 'nullable|string|max:255',
        ]);

        $accountType = $request->input('account_type');
        if ($accountType === 'pwd') {
            $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'contact_number' => 'required|string|max:64',
                'address' => 'required|string|max:255',
                'disability_category' => 'required|string|max:255',
            ]);
        }
        if ($accountType === 'staff') {
            $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'contact_number' => 'required|string|max:64',
                'staff_position' => 'required|string|max:255',
            ]);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        // Pre-fill the AlagaLink profile record so the UI seed data matches the new account.
        try {
            if (Schema::hasTable('alagalink_profiles')) {
                $role = $request->input('alagalink_role');
                if (!in_array($role, ['User', 'Admin'], true)) {
                    $role = $accountType === 'staff' ? 'Admin' : 'User';
                }

                $status = 'Pending';

                $firstName = (string) $request->input('first_name', '');
                $middleName = (string) $request->input('middle_name', '');
                $lastName = (string) $request->input('last_name', '');
                if ($firstName === '' && $lastName === '') {
                    $parts = preg_split('/\s+/', trim((string) $request->input('name', '')));
                    $parts = array_values(array_filter($parts ?: []));
                    $firstName = $parts[0] ?? '';
                    $lastName = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';
                }

                $contactNumber = (string) $request->input('contact_number', '');
                $address = (string) $request->input('address', '');
                $disabilityCategory = (string) $request->input('disability_category', '');
                if ($accountType === 'staff') {
                    $disabilityCategory = 'N/A (Staff/Admin)';
                }

                $customData = [];
                if ($accountType === 'staff') {
                    $customData['staffPosition'] = (string) $request->input('staff_position', '');
                }

                $existing = AlagaLinkProfile::query()->where('email', $user->email)->first();
                $profileId = $existing?->id ?: (string) Str::ulid();

                $profileData = [
                    'id' => $profileId,
                    'email' => (string) $user->email,
                    'role' => $role,
                    'firstName' => $firstName,
                    'middleName' => $middleName,
                    'lastName' => $lastName,
                    'address' => $address,
                    'birthDate' => '',
                    'provincialAddress' => '',
                    'civilStatus' => '',
                    'occupation' => '',
                    'sex' => 'Other',
                    'bloodType' => '',
                    'age' => 0,
                    'contactNumber' => $contactNumber,
                    'disabilityCategory' => $disabilityCategory,
                    'familyComposition' => [],
                    'emergencyContact' => [
                        'name' => '',
                        'relation' => '',
                        'contact' => '',
                    ],
                    'registrantType' => $accountType === 'staff' ? 'PDAO Staff' : 'Self',
                    'status' => $status,
                    'photoUrl' => '',
                    'customData' => (object) $customData,
                    'history' => [
                        'lostAndFound' => [],
                        'programs' => [],
                    ],
                ];
                if ($existing) {
                    $existing->update([
                        'role' => $role,
                        'status' => $status,
                        'data' => $profileData,
                    ]);
                } else {
                    AlagaLinkProfile::query()->create([
                        'id' => $profileId,
                        'email' => $user->email,
                        'role' => $role,
                        'status' => $status,
                        'data' => $profileData,
                    ]);
                }
            }
        } catch (\Throwable) {
            // Ignore profile creation errors to keep registration functional.
        }

        return redirect('/?section=login')
            ->with('status', 'Account created. Please log in.');
    }
}
