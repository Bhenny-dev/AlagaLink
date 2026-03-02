<?php

namespace App\Http\Controllers\AlagaLink;

use App\Http\Controllers\Controller;
use App\Models\AlagaLinkLostReport;
use App\Models\AlagaLinkNotification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LostReportController extends Controller
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
        if (! $isAdmin) {
            throw ValidationException::withMessages([
                'auth' => ['Forbidden.'],
            ]);
        }

        $data = $request->validate([
            'id' => ['nullable', 'string', 'max:128'],
            'userId' => ['required', 'string', 'max:128'],
            'name' => ['required', 'string', 'max:255'],
            'reporterId' => ['required', 'string', 'max:128'],
            'timeMissing' => ['nullable', 'string', 'max:255'],
            'lastSeen' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'clothes' => ['nullable', 'string', 'max:1000'],
            'height' => ['nullable', 'string', 'max:255'],
            'bodyType' => ['nullable', 'string', 'max:255'],
            'dissemination' => ['nullable', 'array'],
            'status' => ['required', Rule::in(['Missing', 'Found', 'Pending'])],
            'isPosted' => ['required', 'boolean'],
            'missingNarrative' => ['nullable', 'array'],
            'foundNarrative' => ['nullable', 'array'],
            'photoUrl' => ['nullable', 'string', 'max:2048'],
        ]);

        $id = (string) ($data['id'] ?? 'lr-'.(string) Str::ulid());

        $payload = [
            ...$data,
            'id' => $id,
        ];

        AlagaLinkLostReport::query()->updateOrCreate(
            ['id' => $id],
            [
                'id' => $id,
                'user_id' => (string) $payload['userId'],
                'reporter_id' => (string) $payload['reporterId'],
                'status' => (string) $payload['status'],
                'is_posted' => (bool) $payload['isPosted'],
                'data' => $payload,
            ],
        );

        // Notify staff/admins. Create per-admin notifications so read-state is per user.
        $adminUsers = User::query()
            ->whereIn('alagalink_role', ['Admin', 'SuperAdmin'])
            ->whereNotNull('alagalink_id')
            ->get(['alagalink_id']);

        $actorNotification = null;

        foreach ($adminUsers as $adminUser) {
            $notifId = 'notif-'.(string) Str::ulid();
            $notifPayload = [
                'id' => $notifId,
                'userId' => (string) $adminUser->alagalink_id,
                'title' => 'New Incident Reported',
                'message' => "Admin, a new missing person report has been filed for {$payload['name']}. Immediate verification required.",
                'type' => 'Urgent',
                'date' => now()->toISOString(),
                'isRead' => false,
                'link' => "lost-found:report:{$id}",
            ];

            AlagaLinkNotification::query()->create([
                'id' => $notifId,
                'user_id' => (string) $adminUser->alagalink_id,
                'target_role' => null,
                'title' => (string) $notifPayload['title'],
                'message' => (string) $notifPayload['message'],
                'type' => (string) $notifPayload['type'],
                'date' => now(),
                'is_read' => false,
                'link' => (string) $notifPayload['link'],
                'program_type' => null,
                'data' => $notifPayload,
            ]);

            if ($actorId !== '' && (string) $adminUser->alagalink_id === $actorId) {
                $actorNotification = $notifPayload;
            }
        }

        return response()->json([
            'report' => $payload,
            'notifications' => $actorNotification ? [$actorNotification] : [],
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

        $report = AlagaLinkLostReport::query()->where('id', $id)->first();
        if (! $report) {
            throw ValidationException::withMessages([
                'id' => ['Report not found.'],
            ]);
        }

        $data = $request->validate([
            'userId' => ['sometimes', 'string', 'max:128'],
            'name' => ['sometimes', 'string', 'max:255'],
            'reporterId' => ['sometimes', 'string', 'max:128'],
            'timeMissing' => ['sometimes', 'nullable', 'string', 'max:255'],
            'lastSeen' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'clothes' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'height' => ['sometimes', 'nullable', 'string', 'max:255'],
            'bodyType' => ['sometimes', 'nullable', 'string', 'max:255'],
            'dissemination' => ['sometimes', 'nullable', 'array'],
            'status' => ['sometimes', Rule::in(['Missing', 'Found', 'Pending'])],
            'isPosted' => ['sometimes', 'boolean'],
            'missingNarrative' => ['sometimes', 'nullable', 'array'],
            'foundNarrative' => ['sometimes', 'nullable', 'array'],
            'photoUrl' => ['sometimes', 'nullable', 'string', 'max:2048'],
        ]);

        $payload = is_array($report->data) ? $report->data : (array) $report->data;
        $payload['id'] = (string) $report->id;

        foreach ($data as $k => $v) {
            $payload[$k] = $v;
        }

        $report->user_id = (string) ($payload['userId'] ?? $report->user_id);
        $report->reporter_id = (string) ($payload['reporterId'] ?? $report->reporter_id);
        $report->status = (string) ($payload['status'] ?? $report->status);
        $report->is_posted = (bool) ($payload['isPosted'] ?? $report->is_posted);
        $report->data = $payload;
        $report->save();

        return response()->json([
            'report' => $payload,
        ]);
    }
}
