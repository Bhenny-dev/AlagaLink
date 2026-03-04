<?php

namespace App\Http\Controllers\AlagaLink;

use App\Http\Controllers\Controller;
use App\Models\AlagaLinkNotification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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

        $user->syncPwdIdMetadata($actor);

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

        $previousRole = (string) ($target->alagalink_role ?: ($existing['role'] ?? 'User'));
        $newRole = (string) $data['role'];

        $payload = [
            ...$existing,
            ...$data,
            'id' => $alagalinkId,
            'email' => (string) $data['email'],
            'role' => (string) $data['role'],
            'status' => (string) $data['status'],
        ];

        // Retract any issued digital card if the user's new status is not eligible.
        $isEligibleForId = ((string) $data['role'] === 'User') && ((string) $data['status'] === 'Active');
        if (! $isEligibleForId && array_key_exists('idMetadata', $payload)) {
            unset($payload['idMetadata']);
        }

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

        // Keep ID issuance/retraction consistent after any status change.
        $target->syncPwdIdMetadata($actor);

        $responseNotifications = [];

        // Create an Activity log entry when the user's role changes.
        if ($previousRole !== $newRole) {
            $targetId = (string) ($target->alagalink_id ?? $alagalinkId);
            $actorId = (string) ($actor->alagalink_id ?? '');

            $isPromotion = $newRole !== 'User' && $previousRole === 'User';
            $isDemotion = $newRole === 'User' && $previousRole !== 'User';

            $type = $isPromotion ? 'Success' : ($isDemotion ? 'Warning' : 'Info');
            $title = $isPromotion ? 'Role Updated — Promoted' : ($isDemotion ? 'Role Updated — Demoted' : 'Role Updated');
            $message = "Role changed: {$previousRole} → {$newRole}.";
            $targetLink = "profile:activities:{$targetId}";
            $adminLink = "members:user:{$targetId}";

            $commonData = [
                'action' => 'role_changed',
                'previousRole' => $previousRole,
                'newRole' => $newRole,
                'targetUserId' => $targetId,
                'actorUserId' => $actorId !== '' ? $actorId : null,
            ];

            $targetNotifId = 'notif-'.(string) Str::ulid();
            AlagaLinkNotification::query()->create([
                'id' => $targetNotifId,
                'user_id' => $targetId,
                'target_role' => null,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'date' => now(),
                'is_read' => false,
                'link' => $targetLink,
                'program_type' => null,
                'data' => $commonData,
            ]);

            $targetNotifPayload = [
                'id' => $targetNotifId,
                'userId' => $targetId,
                'targetRole' => null,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'date' => now()->toISOString(),
                'isRead' => false,
                'link' => $targetLink,
                'programType' => null,
                'data' => $commonData,
            ];

            if ($actorId !== '' && $actorId !== $targetId) {
                $adminNotifId = 'notif-'.(string) Str::ulid();
                AlagaLinkNotification::query()->create([
                    'id' => $adminNotifId,
                    'user_id' => $actorId,
                    'target_role' => null,
                    'title' => 'Staff Role Updated',
                    'message' => "Updated {$targetId}: {$previousRole} → {$newRole}.",
                    'type' => 'Info',
                    'date' => now(),
                    'is_read' => false,
                    'link' => $adminLink,
                    'program_type' => null,
                    'data' => $commonData,
                ]);

                $responseNotifications[] = [
                    'id' => $adminNotifId,
                    'userId' => $actorId,
                    'targetRole' => null,
                    'title' => 'Staff Role Updated',
                    'message' => "Updated {$targetId}: {$previousRole} → {$newRole}.",
                    'type' => 'Info',
                    'date' => now()->toISOString(),
                    'isRead' => false,
                    'link' => $adminLink,
                    'programType' => null,
                    'data' => $commonData,
                ];
            } elseif ($actorId !== '' && $actorId === $targetId) {
                // When editing self, the target notification is also visible immediately.
                $responseNotifications[] = $targetNotifPayload;
            }
        }

        return response()->json([
            'user' => $target->alagalink_data,
            'notifications' => $responseNotifications,
        ]);
    }
}
