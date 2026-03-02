<?php

namespace App\Http\Controllers\AlagaLink;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserProfileController extends Controller
{
    /**
     * Create a new AlagaLink user profile (stored in `users`).
     */
    public function store(Request $request): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            throw ValidationException::withMessages([
                'auth' => ['Unauthenticated.'],
            ]);
        }

        $actorRole = (string) ($actor->alagalink_role ?? 'User');
        $isAdmin = in_array($actorRole, ['Admin', 'SuperAdmin'], true);
        if (! $isAdmin) {
            throw ValidationException::withMessages([
                'auth' => ['Forbidden.'],
            ]);
        }

        $data = $request->validate([
            'id' => ['required', 'string', 'max:64'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['User', 'Admin', 'SuperAdmin'])],
            'status' => ['required', Rule::in(['Active', 'Suspended', 'Pending'])],
            'firstName' => ['nullable', 'string', 'max:255'],
            'middleName' => ['nullable', 'string', 'max:255'],
            'lastName' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'birthDate' => ['nullable', 'string', 'max:32'],
            'provincialAddress' => ['nullable', 'string', 'max:255'],
            'civilStatus' => ['nullable', 'string', 'max:64'],
            'occupation' => ['nullable', 'string', 'max:255'],
            'sex' => ['nullable', Rule::in(['Male', 'Female', 'Other'])],
            'bloodType' => ['nullable', 'string', 'max:8'],
            'age' => ['nullable', 'integer', 'min:0', 'max:200'],
            'contactNumber' => ['nullable', 'string', 'max:64'],
            'disabilityCategory' => ['nullable', 'string', 'max:255'],
            'familyComposition' => ['nullable', 'array'],
            'emergencyContact' => ['nullable', 'array'],
            'registrantType' => ['nullable', 'string', 'max:64'],
            'photoUrl' => ['nullable', 'string', 'max:2048'],
            'customData' => ['nullable', 'array'],
            'history' => ['nullable', 'array'],
        ]);

        $alagalinkId = (string) $data['id'];

        if (User::query()->where('alagalink_id', $alagalinkId)->exists()) {
            throw ValidationException::withMessages([
                'id' => ['ID already exists.'],
            ]);
        }

        $firstName = (string) ($data['firstName'] ?? '');
        $lastName = (string) ($data['lastName'] ?? '');
        $name = trim($firstName.' '.$lastName);
        if ($name === '') {
            $name = (string) $data['email'];
        }

        $password = app()->environment(['local', 'testing']) ? 'password' : (string) str()->random(32);

        $payload = [
            ...$data,
            'id' => $alagalinkId,
            'email' => (string) $data['email'],
            'role' => (string) $data['role'],
            'status' => (string) $data['status'],
        ];

        $user = User::query()->create([
            'name' => $name,
            'email' => (string) $data['email'],
            'password' => $password,
            'alagalink_id' => $alagalinkId,
            'alagalink_role' => (string) $data['role'],
            'alagalink_status' => (string) $data['status'],
            'alagalink_data' => $payload,
        ]);

        return response()->json([
            'user' => $user->alagalink_data,
        ]);
    }

    /**
     * Update an AlagaLink user profile by `alagalink_id`.
     */
    public function update(Request $request, string $alagalinkId): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            throw ValidationException::withMessages([
                'auth' => ['Unauthenticated.'],
            ]);
        }

        $target = User::query()->where('alagalink_id', $alagalinkId)->first();
        if (! $target) {
            throw ValidationException::withMessages([
                'id' => ['User not found.'],
            ]);
        }

        $actorRole = (string) ($actor->alagalink_role ?? 'User');
        $isAdmin = in_array($actorRole, ['Admin', 'SuperAdmin'], true);
        if (! $isAdmin) {
            throw ValidationException::withMessages([
                'auth' => ['Forbidden.'],
            ]);
        }

        $data = $request->validate([
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($target->id)],
            'role' => ['required', Rule::in(['User', 'Admin', 'SuperAdmin'])],
            'status' => ['required', Rule::in(['Active', 'Suspended', 'Pending'])],
            'firstName' => ['nullable', 'string', 'max:255'],
            'middleName' => ['nullable', 'string', 'max:255'],
            'lastName' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'birthDate' => ['nullable', 'string', 'max:32'],
            'provincialAddress' => ['nullable', 'string', 'max:255'],
            'civilStatus' => ['nullable', 'string', 'max:64'],
            'occupation' => ['nullable', 'string', 'max:255'],
            'sex' => ['nullable', Rule::in(['Male', 'Female', 'Other'])],
            'bloodType' => ['nullable', 'string', 'max:8'],
            'age' => ['nullable', 'integer', 'min:0', 'max:200'],
            'contactNumber' => ['nullable', 'string', 'max:64'],
            'disabilityCategory' => ['nullable', 'string', 'max:255'],
            'familyComposition' => ['nullable', 'array'],
            'emergencyContact' => ['nullable', 'array'],
            'registrantType' => ['nullable', 'string', 'max:64'],
            'photoUrl' => ['nullable', 'string', 'max:2048'],
            'customData' => ['nullable', 'array'],
            'history' => ['nullable', 'array'],
        ]);

        // Non-super admins cannot grant SuperAdmin.
        if ($actorRole !== 'SuperAdmin' && (string) $data['role'] === 'SuperAdmin') {
            throw ValidationException::withMessages([
                'role' => ['Only SuperAdmin can grant SuperAdmin role.'],
            ]);
        }

        $existing = is_array($target->alagalink_data) ? $target->alagalink_data : [];
        $payload = [
            ...$existing,
            ...$data,
            'id' => $alagalinkId,
            'email' => (string) $data['email'],
            'role' => (string) $data['role'],
            'status' => (string) $data['status'],
        ];

        $firstName = (string) ($payload['firstName'] ?? '');
        $lastName = (string) ($payload['lastName'] ?? '');
        $name = trim($firstName.' '.$lastName);
        if ($name === '') {
            $name = (string) $payload['email'];
        }

        $target->forceFill([
            'name' => $name,
            'email' => (string) $data['email'],
            'alagalink_role' => (string) $data['role'],
            'alagalink_status' => (string) $data['status'],
            'alagalink_data' => $payload,
        ])->save();

        return response()->json([
            'user' => $target->alagalink_data,
        ]);
    }
}
