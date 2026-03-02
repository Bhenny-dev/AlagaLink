<?php

namespace App\Http\Controllers\AlagaLink;

use App\Http\Controllers\Controller;
use App\Models\AlagaLinkNotification;
use App\Models\AlagaLinkProgramAvailment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProgramAvailmentController extends Controller
{
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
        $actorId = (string) ($actor->alagalink_id ?? '');

        $data = $request->validate([
            'id' => ['nullable', 'string', 'max:128'],
            'userId' => ['required', 'string', 'max:128'],
            'programType' => ['required', Rule::in(['ID', 'Device', 'Medical', 'PhilHealth', 'Livelihood'])],
            'title' => ['required', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['Pending', 'Approved', 'Rejected', 'Completed', 'Ready for Claiming', 'Out for Delivery'])],
            'dateApplied' => ['required', 'date'],
            'details' => ['nullable', 'string', 'max:4000'],
            'paymentStatus' => ['nullable', Rule::in(['Unpaid', 'Paid'])],
            'paymentMethod' => ['nullable', Rule::in(['Online', 'Upon Claiming'])],
            'issuanceDate' => ['nullable', 'string', 'max:64'],
            'issuanceLocation' => ['nullable', 'string', 'max:255'],
            'adminNarrative' => ['nullable', 'array'],
            'philhealthConsent' => ['nullable', 'boolean'],
            'deliveryMethod' => ['nullable', Rule::in(['Pickup', 'Delivery'])],
            'deliveryDate' => ['nullable', 'string', 'max:64'],
            'deliveryCourier' => ['nullable', 'string', 'max:255'],
            'deliveryStatus' => ['nullable', 'string', 'max:255'],
            'requestedItemId' => ['nullable', 'string', 'max:128'],
        ]);

        $id = (string) ($data['id'] ?? 'pa-'.(string) Str::ulid());

        $status = (string) ($data['status'] ?? 'Pending');
        if (! $isAdmin) {
            $status = 'Pending';
        }

        $payload = [
            ...$data,
            'id' => $id,
            'status' => $status,
        ];

        AlagaLinkProgramAvailment::query()->updateOrCreate(
            ['id' => $id],
            [
                'id' => $id,
                'user_id' => (string) $payload['userId'],
                'program_type' => (string) $payload['programType'],
                'title' => (string) $payload['title'],
                'status' => (string) $payload['status'],
                'date_applied' => (string) $payload['dateApplied'],
                'data' => $payload,
            ],
        );

        // Notify the requesting user.
        $userNotifId = 'notif-'.(string) Str::ulid();
        $userNotifPayload = [
            'id' => $userNotifId,
            'userId' => (string) $payload['userId'],
            'title' => 'Request Logged',
            'message' => "We have received your application for {$payload['title']}. It is now pending evaluation.",
            'type' => 'Info',
            'date' => now()->toISOString(),
            'isRead' => false,
            'link' => "programs:requests:{$id}",
            'programType' => (string) $payload['programType'],
        ];

        AlagaLinkNotification::query()->create([
            'id' => $userNotifId,
            'user_id' => (string) $payload['userId'],
            'target_role' => null,
            'title' => (string) $userNotifPayload['title'],
            'message' => (string) $userNotifPayload['message'],
            'type' => (string) $userNotifPayload['type'],
            'date' => now(),
            'is_read' => false,
            'link' => (string) $userNotifPayload['link'],
            'program_type' => (string) $payload['programType'],
            'data' => $userNotifPayload,
        ]);

        // Notify admins (per-user so read-state is per admin).
        $adminUsers = User::query()
            ->whereIn('alagalink_role', ['Admin', 'SuperAdmin'])
            ->whereNotNull('alagalink_id')
            ->get(['alagalink_id']);

        $actorAdminNotification = null;

        foreach ($adminUsers as $adminUser) {
            $adminNotifId = 'notif-'.(string) Str::ulid();
            $adminNotifPayload = [
                'id' => $adminNotifId,
                'userId' => (string) $adminUser->alagalink_id,
                'title' => 'New Evaluation Pending',
                'message' => "A new {$payload['programType']} request has been submitted and requires administrative review.",
                'type' => 'Warning',
                'date' => now()->toISOString(),
                'isRead' => false,
                'link' => "programs:requests:{$id}",
                'programType' => (string) $payload['programType'],
            ];

            AlagaLinkNotification::query()->create([
                'id' => $adminNotifId,
                'user_id' => (string) $adminUser->alagalink_id,
                'target_role' => null,
                'title' => (string) $adminNotifPayload['title'],
                'message' => (string) $adminNotifPayload['message'],
                'type' => (string) $adminNotifPayload['type'],
                'date' => now(),
                'is_read' => false,
                'link' => (string) $adminNotifPayload['link'],
                'program_type' => (string) $payload['programType'],
                'data' => $adminNotifPayload,
            ]);

            if ($actorId !== '' && (string) $adminUser->alagalink_id === $actorId) {
                $actorAdminNotification = $adminNotifPayload;
            }
        }

        return response()->json([
            'request' => $payload,
            'notifications' => array_values(array_filter([
                // The requester sees their confirmation immediately.
                ((string) $payload['userId'] === $actorId) ? $userNotifPayload : null,
                // Admin actor sees the admin alert immediately.
                $actorAdminNotification,
            ])),
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
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

        $existing = AlagaLinkProgramAvailment::query()->where('id', $id)->first();
        if (! $existing) {
            throw ValidationException::withMessages([
                'id' => ['Request not found.'],
            ]);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['Pending', 'Approved', 'Rejected', 'Completed', 'Ready for Claiming', 'Out for Delivery'])],
            'adminNarrative' => ['nullable', 'array'],
            'issuanceDate' => ['nullable', 'string', 'max:64'],
            'issuanceLocation' => ['nullable', 'string', 'max:255'],
            'deliveryMethod' => ['nullable', Rule::in(['Pickup', 'Delivery'])],
            'deliveryDate' => ['nullable', 'string', 'max:64'],
            'deliveryCourier' => ['nullable', 'string', 'max:255'],
            'deliveryStatus' => ['nullable', 'string', 'max:255'],
        ]);

        $existingPayload = is_array($existing->data) ? $existing->data : [];
        $payload = [
            ...$existingPayload,
            ...$data,
            'id' => $existing->id,
            'userId' => (string) $existing->user_id,
            'programType' => (string) $existing->program_type,
            'title' => (string) $existing->title,
            'dateApplied' => $existingPayload['dateApplied'] ?? optional($existing->date_applied)->toDateString() ?? null,
        ];

        $existing->forceFill([
            'status' => (string) $data['status'],
            'data' => $payload,
        ])->save();

        // Notify the requesting user about status change.
        $notifId = 'notif-'.(string) Str::ulid();
        $notifPayload = [
            'id' => $notifId,
            'userId' => (string) $existing->user_id,
            'title' => "Application {$data['status']}",
            'message' => "Your request for {$existing->title} has been updated to {$data['status']}.",
            'type' => in_array((string) $data['status'], ['Approved', 'Completed'], true) ? 'Success' : ((string) $data['status'] === 'Rejected' ? 'Urgent' : 'Info'),
            'date' => now()->toISOString(),
            'isRead' => false,
            'link' => "programs:requests:{$existing->id}",
            'programType' => (string) $existing->program_type,
        ];

        AlagaLinkNotification::query()->create([
            'id' => $notifId,
            'user_id' => (string) $existing->user_id,
            'target_role' => null,
            'title' => (string) $notifPayload['title'],
            'message' => (string) $notifPayload['message'],
            'type' => (string) $notifPayload['type'],
            'date' => now(),
            'is_read' => false,
            'link' => (string) $notifPayload['link'],
            'program_type' => (string) $existing->program_type,
            'data' => $notifPayload,
        ]);

        return response()->json([
            'request' => $existing->data,
        ]);
    }
}
