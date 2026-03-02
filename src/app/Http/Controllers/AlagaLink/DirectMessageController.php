<?php

namespace App\Http\Controllers\AlagaLink;

use App\Http\Controllers\Controller;
use App\Models\AlagaLinkDirectMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DirectMessageController extends Controller
{
    private const OFFICE_ID = 'PDAO_OFFICE';

    public function thread(Request $request, string $peerId): JsonResponse
    {
        $profile = $this->currentProfile($request);

        [$threadKey] = $this->threadKeyFor($profile, $peerId);

        $after = $request->query('after');

        $query = AlagaLinkDirectMessage::query()
            ->where('thread_key', $threadKey)
            ->orderBy('created_at');

        if (is_string($after) && trim($after) !== '') {
            $query->where('created_at', '>', $after);
        }

        $messages = $query->limit(200)->get()->map(function (AlagaLinkDirectMessage $m) {
            return [
                'id' => $m->id,
                'senderId' => $m->sender_id,
                'text' => $m->body,
                'timestamp' => optional($m->created_at)->toISOString(),
                'meta' => $m->meta,
            ];
        })->values();

        return response()->json([
            'threadKey' => $threadKey,
            'messages' => $messages,
        ]);
    }

    /**
     * Store a new direct message.
     */
    public function store(Request $request): JsonResponse
    {
        $profile = $this->currentProfile($request);

        $data = $request->validate([
            'toUserId' => ['required', 'string', 'max:64'],
            'text' => ['required', 'string', 'max:2000'],
            'meta' => ['nullable', 'array'],
        ]);

        $toUserId = $data['toUserId'];

        if ($profile['id'] === $toUserId) {
            throw ValidationException::withMessages([
                'toUserId' => ['Cannot message yourself.'],
            ]);
        }

        [$threadKey, $meta] = $this->threadKeyFor($profile, $toUserId, $data['meta'] ?? null);

        $message = AlagaLinkDirectMessage::create([
            'id' => (string) Str::ulid(),
            'thread_key' => $threadKey,
            'sender_id' => $profile['id'],
            'recipient_id' => $toUserId,
            'body' => $data['text'],
            'meta' => $meta,
        ]);

        return response()->json([
            'threadKey' => $threadKey,
            'message' => [
                'id' => $message->id,
                'senderId' => $message->sender_id,
                'text' => $message->body,
                'timestamp' => optional($message->created_at)->toISOString(),
                'meta' => $message->meta,
            ],
        ]);
    }

    /**
     * Returns [threadKey, mergedMeta].
     */
    private function threadKeyFor(array $currentProfile, string $peerId, ?array $providedMeta = null): array
    {
        $currentRole = $currentProfile['role'] ?? 'User';

        // Office thread (member-facing consolidated thread)
        if ($peerId === self::OFFICE_ID) {
            $threadKey = collect([self::OFFICE_ID, $currentProfile['id']])->sort()->implode('_');
            return [$threadKey, $providedMeta];
        }

        $peerRole = $this->profileRole($peerId);

        // Staff -> Member messages are written into OFFICE <-> Member thread.
        if ($currentRole !== 'User' && $peerRole === 'User') {
            $threadKey = collect([self::OFFICE_ID, $peerId])->sort()->implode('_');
            $meta = array_merge($providedMeta ?? [], ['viaOffice' => true]);
            return [$threadKey, $meta];
        }

        $threadKey = collect([$currentProfile['id'], $peerId])->sort()->implode('_');
        return [$threadKey, $providedMeta];
    }

    private function profileRole(string $profileId): string
    {
        if ($profileId === self::OFFICE_ID) {
            return 'Admin';
        }

        $user = User::query()->where('alagalink_id', $profileId)->first();
        if ($user?->alagalink_role) {
            return (string) $user->alagalink_role;
        }

        $role = data_get($user?->alagalink_data, 'role');
        if (is_string($role) && $role !== '') {
            return $role;
        }

        return 'User';
    }

    /**
     * Resolves the authenticated Laravel user to an AlagaLink profile id.
     */
    private function currentProfile(Request $request): array
    {
        $user = $request->user();
        if (! $user) {
            throw ValidationException::withMessages([
                'auth' => ['Unauthenticated.'],
            ]);
        }

        /** @var \App\Models\User $user */
        $profileId = (string) ($user->alagalink_id ?: ('laravel-'.$user->id));
        $role = (string) ($user->alagalink_role ?: data_get($user->alagalink_data, 'role', 'User'));

        return [
            'id' => $profileId,
            'role' => $role,
        ];
    }
}
