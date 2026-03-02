<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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
            'birth_date' => 'nullable|date',
            'sex' => 'nullable|in:Male,Female,Other',
            'blood_type' => 'nullable|in:O+,O-,A+,A-,B+,B-,AB+,AB-',
            'disability_category' => 'nullable|string|max:255',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_relation' => 'nullable|string|max:255',
            'emergency_contact_number' => 'nullable|string|max:64',
            'staff_office' => 'nullable|string|max:255',
            'staff_position' => 'nullable|string|max:255',
        ]);

        $accountType = $request->input('account_type');
        if ($accountType === 'pwd') {
            $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'contact_number' => 'required|string|max:64',
                'address' => 'required|string|max:255',
                'birth_date' => 'required|date',
                'sex' => 'required|in:Male,Female,Other',
                'blood_type' => 'required|in:O+,O-,A+,A-,B+,B-,AB+,AB-',
                'disability_category' => 'required|string|max:255',
                'emergency_contact_name' => 'required|string|max:255',
                'emergency_contact_relation' => 'required|string|max:255',
                'emergency_contact_number' => 'required|string|max:64',
            ]);
        }
        if ($accountType === 'staff') {
            $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'contact_number' => 'required|string|max:64',
                'address' => 'required|string|max:255',
                'birth_date' => 'required|date',
                'sex' => 'required|in:Male,Female,Other',
                'blood_type' => 'required|in:O+,O-,A+,A-,B+,B-,AB+,AB-',
                'staff_office' => 'required|string|max:255',
                'staff_position' => 'required|string|max:255',
                'emergency_contact_name' => 'required|string|max:255',
                'emergency_contact_relation' => 'required|string|max:255',
                'emergency_contact_number' => 'required|string|max:64',
            ]);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $role = $request->input('alagalink_role');
        if (!in_array($role, ['User', 'Admin', 'SuperAdmin'], true)) {
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
        $birthDate = (string) $request->input('birth_date', '');
        $sex = (string) $request->input('sex', 'Other');
        $bloodType = (string) $request->input('blood_type', '');
        $emergencyContactName = (string) $request->input('emergency_contact_name', '');
        $emergencyContactRelation = (string) $request->input('emergency_contact_relation', '');
        $emergencyContactNumber = (string) $request->input('emergency_contact_number', '');

        $age = 0;
        if (is_string($birthDate) && $birthDate !== '') {
            try {
                $dob = new \DateTimeImmutable($birthDate);
                $today = new \DateTimeImmutable('today');
                $diff = $today->diff($dob);
                $age = max(0, (int) $diff->y);
            } catch (\Throwable) {
                $age = 0;
            }
        }

        $disabilityCategory = (string) $request->input('disability_category', '');
        if ($accountType === 'staff') {
            $disabilityCategory = 'N/A (Staff/Admin)';
        }

        $customData = [];
        if ($accountType === 'staff') {
            $customData['staffPosition'] = (string) $request->input('staff_position', '');
            $customData['staffOffice'] = (string) $request->input('staff_office', '');
        }

        $alagalinkId = 'laravel-'.$user->id;

        $profileData = [
            'id' => $alagalinkId,
            'email' => (string) $user->email,
            'role' => $role,
            'firstName' => $firstName,
            'middleName' => $middleName,
            'lastName' => $lastName,
            'address' => $address,
            'birthDate' => $birthDate,
            'provincialAddress' => '',
            'civilStatus' => '',
            'occupation' => '',
            'sex' => in_array($sex, ['Male', 'Female', 'Other'], true) ? $sex : 'Other',
            'bloodType' => $bloodType,
            'age' => $age,
            'contactNumber' => $contactNumber,
            'disabilityCategory' => $disabilityCategory,
            'familyComposition' => [],
            'emergencyContact' => [
                'name' => $emergencyContactName,
                'relation' => $emergencyContactRelation,
                'contact' => $emergencyContactNumber,
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

        $user->forceFill([
            'alagalink_id' => $alagalinkId,
            'alagalink_role' => $role,
            'alagalink_status' => $status,
            'alagalink_data' => $profileData,
        ])->save();

        event(new Registered($user));

        return redirect('/?section=login')
            ->with('status', 'Account created. Please log in.');
    }
}
