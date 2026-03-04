<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DirectMessagesUnreadTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_sees_office_unread_and_can_mark_read(): void
    {
        $admin = User::factory()->create([
            'alagalink_id' => 'admin-1',
            'alagalink_role' => 'Admin',
        ]);

        $member = User::factory()->create([
            'alagalink_id' => 'member-1',
            'alagalink_role' => 'User',
        ]);

        // Admin sends a message to a member (stored as viaOffice thread).
        $this->actingAs($admin)
            ->postJson('/api/direct-messages', [
                'toUserId' => 'member-1',
                'text' => 'Hello member',
            ])
            ->assertOk();

        // Member should see it as an unread Office thread.
        $summary = $this->actingAs($member)
            ->getJson('/api/direct-messages/unread-summary')
            ->assertOk()
            ->json();

        $this->assertSame(1, $summary['totalUnread']);

        $officePeer = collect($summary['peers'])->firstWhere('peerId', 'PDAO_OFFICE');
        $this->assertNotNull($officePeer);
        $this->assertSame(1, $officePeer['unreadCount']);

        // Mark the office thread as read.
        $this->actingAs($member)
            ->postJson('/api/direct-messages/thread/PDAO_OFFICE/mark-read')
            ->assertOk();

        $summaryAfter = $this->actingAs($member)
            ->getJson('/api/direct-messages/unread-summary')
            ->assertOk()
            ->json();

        $this->assertSame(0, $summaryAfter['totalUnread']);

        $officePeerAfter = collect($summaryAfter['peers'])->firstWhere('peerId', 'PDAO_OFFICE');
        $this->assertNotNull($officePeerAfter);
        $this->assertSame(0, $officePeerAfter['unreadCount']);
    }

    public function test_admin_sees_member_unread_in_office_inbox_and_can_mark_read(): void
    {
        $admin = User::factory()->create([
            'alagalink_id' => 'admin-1',
            'alagalink_role' => 'Admin',
        ]);

        $member = User::factory()->create([
            'alagalink_id' => 'member-1',
            'alagalink_role' => 'User',
        ]);

        // Member sends to the office inbox.
        $this->actingAs($member)
            ->postJson('/api/direct-messages', [
                'toUserId' => 'PDAO_OFFICE',
                'text' => 'Help please',
            ])
            ->assertOk();

        $summary = $this->actingAs($admin)
            ->getJson('/api/direct-messages/unread-summary')
            ->assertOk()
            ->json();

        $this->assertSame(1, $summary['totalUnread']);

        $memberPeer = collect($summary['peers'])->firstWhere('peerId', 'member-1');
        $this->assertNotNull($memberPeer);
        $this->assertSame(1, $memberPeer['unreadCount']);

        $this->actingAs($admin)
            ->postJson('/api/direct-messages/thread/member-1/mark-read')
            ->assertOk();

        $summaryAfter = $this->actingAs($admin)
            ->getJson('/api/direct-messages/unread-summary')
            ->assertOk()
            ->json();

        $this->assertSame(0, $summaryAfter['totalUnread']);

        $memberPeerAfter = collect($summaryAfter['peers'])->firstWhere('peerId', 'member-1');
        $this->assertNotNull($memberPeerAfter);
        $this->assertSame(0, $memberPeerAfter['unreadCount']);
    }
}
