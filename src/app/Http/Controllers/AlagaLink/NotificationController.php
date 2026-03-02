<?php

namespace App\Http\Controllers\AlagaLink;

use App\Http\Controllers\Controller;
use App\Models\AlagaLinkNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class NotificationController extends Controller
{
    public function markRead(Request $request, string $id): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            throw ValidationException::withMessages([
                'auth' => ['Unauthenticated.'],
            ]);
        }

        $actorId = (string) ($actor->alagalink_id ?? '');
        $actorRole = (string) ($actor->alagalink_role ?? 'User');

        $notif = AlagaLinkNotification::query()->where('id', $id)->first();
        if (! $notif) {
            throw ValidationException::withMessages([
                'id' => ['Notification not found.'],
            ]);
        }

        $belongsToActor = $notif->user_id !== null && (string) $notif->user_id === $actorId;
        $roleMatches = $notif->target_role !== null && (string) $notif->target_role === $actorRole;

        // Admins/SuperAdmins should still only be able to mark notifications visible to them.
        if (! $belongsToActor && ! $roleMatches) {
            throw ValidationException::withMessages([
                'auth' => ['Forbidden.'],
            ]);
        }

        $notif->forceFill([
            'is_read' => true,
        ])->save();

        $payload = is_array($notif->data) ? $notif->data : [];
        $payload['isRead'] = true;
        $notif->forceFill(['data' => $payload])->save();

        return response()->json([
            'notification' => $notif->data,
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            throw ValidationException::withMessages([
                'auth' => ['Unauthenticated.'],
            ]);
        }

        $actorId = (string) ($actor->alagalink_id ?? '');
        $actorRole = (string) ($actor->alagalink_role ?? 'User');

        $query = AlagaLinkNotification::query();

        if ($actorId !== '') {
            $query->where(function ($q) use ($actorId, $actorRole) {
                $q->where('user_id', $actorId)
                    ->orWhere('target_role', $actorRole);
            });
        } else {
            $query->where('target_role', $actorRole);
        }

        $notifs = $query->get();

        foreach ($notifs as $notif) {
            $payload = is_array($notif->data) ? $notif->data : [];
            $payload['isRead'] = true;
            $notif->forceFill([
                'is_read' => true,
                'data' => $payload,
            ])->save();
        }

        return response()->json([
            'cleared' => true,
        ]);
    }
}
