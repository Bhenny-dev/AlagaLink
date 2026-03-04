<?php

namespace App\Http\Controllers\AlagaLink;

use App\Http\Controllers\Controller;
use App\Models\AlagaLinkDirectMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DirectMessageController extends Controller
{
    private const OFFICE_ID = 'PDAO_OFFICE';

    public function unreadSummary(Request $request): JsonResponse
    {
        $profile = $this->currentProfile($request);

        $profileId = (string) ($profile['id'] ?? '');
        $role = (string) ($profile['role'] ?? 'User');

        $isAdmin = in_array($role, ['Admin', 'SuperAdmin'], true);

        /** @var array<string,int> $unreadByPeer */
        $unreadByPeer = [];
        /** @var array<string,Carbon> $lastByPeer */
        $lastByPeer = [];

        if ($isAdmin) {
            // Office inbox: member -> office unread counts (shared inbox).
            $officeUnread = AlagaLinkDirectMessage::query()
                ->selectRaw('sender_id as peer_id, COUNT(*) as unread_count')
                ->where('recipient_id', self::OFFICE_ID)
                ->whereNull('read_at')
                ->groupBy('sender_id')
                ->get();

            foreach ($officeUnread as $row) {
                $peerId = (string) $row->peer_id;
                $unreadByPeer[$peerId] = (int) $row->unread_count;
            }

            // Office inbox: last activity per member (both directions via office thread).
            $officeLast = AlagaLinkDirectMessage::query()
                ->selectRaw('CASE WHEN recipient_id = ? THEN sender_id ELSE recipient_id END as peer_id', [self::OFFICE_ID])
                ->selectRaw('MAX(created_at) as last_at')
                ->where(function ($q) {
                    $q->where('recipient_id', self::OFFICE_ID)
                        ->orWhere('meta->viaOffice', true);
                })
                ->groupBy('peer_id')
                ->get();

            foreach ($officeLast as $row) {
                $peerId = (string) $row->peer_id;
                if ($row->last_at) {
                    $lastByPeer[$peerId] = Carbon::parse($row->last_at);
                }
            }

            // Direct staff threads: unread counts (messages sent to this staff profile).
            $directUnread = AlagaLinkDirectMessage::query()
                ->selectRaw('sender_id as peer_id, COUNT(*) as unread_count')
                ->where('recipient_id', $profileId)
                ->whereNull('read_at')
                ->groupBy('sender_id')
                ->get();

            foreach ($directUnread as $row) {
                $peerId = (string) $row->peer_id;
                $unreadByPeer[$peerId] = ($unreadByPeer[$peerId] ?? 0) + (int) $row->unread_count;
            }

            // Direct staff threads: last activity per peer.
            $directLast = AlagaLinkDirectMessage::query()
                ->selectRaw('CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END as peer_id', [$profileId])
                ->selectRaw('MAX(created_at) as last_at')
                ->where(function ($q) use ($profileId) {
                    $q->where('sender_id', $profileId)
                        ->orWhere('recipient_id', $profileId);
                })
                ->where('recipient_id', '!=', self::OFFICE_ID)
                ->where(function ($q) {
                    // Exclude staff->member messages that are routed through the office thread.
                    $q->whereNull('meta->viaOffice')->orWhere('meta->viaOffice', false);
                })
                ->groupBy('peer_id')
                ->get();

            foreach ($directLast as $row) {
                $peerId = (string) $row->peer_id;
                if ($row->last_at) {
                    $ts = Carbon::parse($row->last_at);
                    if (! isset($lastByPeer[$peerId]) || $ts->greaterThan($lastByPeer[$peerId])) {
                        $lastByPeer[$peerId] = $ts;
                    }
                }
            }
        } else {
            // Regular users: treat consolidated office thread as a single peer (OFFICE_ID).
            $officeUnreadCount = (int) AlagaLinkDirectMessage::query()
                ->where('recipient_id', $profileId)
                ->whereNull('read_at')
                ->where('meta->viaOffice', true)
                ->count();

            if ($officeUnreadCount > 0) {
                $unreadByPeer[self::OFFICE_ID] = $officeUnreadCount;
            }

            $officeLastAt = AlagaLinkDirectMessage::query()
                ->where(function ($q) use ($profileId) {
                    $q->where(function ($q2) use ($profileId) {
                        $q2->where('sender_id', $profileId)->where('recipient_id', self::OFFICE_ID);
                    })->orWhere(function ($q2) use ($profileId) {
                        $q2->where('recipient_id', $profileId)->where('meta->viaOffice', true);
                    });
                })
                ->max('created_at');

            if ($officeLastAt) {
                $lastByPeer[self::OFFICE_ID] = Carbon::parse($officeLastAt);
            }

            // If any direct messages exist between users (non-office), track them too.
            $directUnread = AlagaLinkDirectMessage::query()
                ->selectRaw('sender_id as peer_id, COUNT(*) as unread_count')
                ->where('recipient_id', $profileId)
                ->whereNull('read_at')
                ->where(function ($q) {
                    $q->whereNull('meta->viaOffice')->orWhere('meta->viaOffice', false);
                })
                ->where('sender_id', '!=', self::OFFICE_ID)
                ->groupBy('sender_id')
                ->get();

            foreach ($directUnread as $row) {
                $peerId = (string) $row->peer_id;
                $unreadByPeer[$peerId] = (int) $row->unread_count;
            }

            $directLast = AlagaLinkDirectMessage::query()
                ->selectRaw('CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END as peer_id', [$profileId])
                ->selectRaw('MAX(created_at) as last_at')
                ->where(function ($q) use ($profileId) {
                    $q->where('sender_id', $profileId)
                        ->orWhere('recipient_id', $profileId);
                })
                ->where('recipient_id', '!=', self::OFFICE_ID)
                ->where('sender_id', '!=', self::OFFICE_ID)
                ->where(function ($q) {
                    $q->whereNull('meta->viaOffice')->orWhere('meta->viaOffice', false);
                })
                ->groupBy('peer_id')
                ->get();

            foreach ($directLast as $row) {
                $peerId = (string) $row->peer_id;
                if ($row->last_at) {
                    $lastByPeer[$peerId] = Carbon::parse($row->last_at);
                }
            }
        }

        $peers = collect(array_unique(array_merge(array_keys($unreadByPeer), array_keys($lastByPeer))))
            ->map(function (string $peerId) use ($unreadByPeer, $lastByPeer) {
                $last = $lastByPeer[$peerId] ?? null;
                return [
                    'peerId' => $peerId,
                    'unreadCount' => (int) ($unreadByPeer[$peerId] ?? 0),
                    'lastMessageAt' => $last ? $last->toISOString() : null,
                ];
            })
            ->values();

        $totalUnread = array_sum($unreadByPeer);

        return response()->json([
            'totalUnread' => (int) $totalUnread,
            'peers' => $peers,
        ]);
    }

    public function markRead(Request $request, string $peerId): JsonResponse
    {
        $profile = $this->currentProfile($request);

        $profileId = (string) ($profile['id'] ?? '');
        $role = (string) ($profile['role'] ?? 'User');
        $peerRole = $this->profileRole($peerId);

        [$threadKey] = $this->threadKeyFor($profile, $peerId);

        $query = AlagaLinkDirectMessage::query()
            ->where('thread_key', $threadKey)
            ->whereNull('read_at');

        // Staff viewing a member thread: mark member -> office inbox messages as read (shared inbox).
        if ($role !== 'User' && $peerRole === 'User') {
            $query->where('recipient_id', self::OFFICE_ID)
                ->where('sender_id', $peerId);
        } elseif ($peerId === self::OFFICE_ID) {
            // Member viewing the office thread: mark any incoming messages in that thread as read.
            $query->where('recipient_id', $profileId);
        } else {
            // Normal direct thread.
            $query->where('recipient_id', $profileId)
                ->where('sender_id', $peerId);
        }

        $updated = $query->update([
            'read_at' => now(),
        ]);

        return response()->json([
            'threadKey' => $threadKey,
            'updated' => (int) $updated,
        ]);
    }

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
