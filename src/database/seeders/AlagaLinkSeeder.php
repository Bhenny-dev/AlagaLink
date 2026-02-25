<?php

namespace Database\Seeders;

use App\Models\AlagaLinkLostReport;
use App\Models\AlagaLinkNotification;
use App\Models\AlagaLinkProfile;
use App\Models\AlagaLinkProgram;
use App\Models\AlagaLinkProgramAvailment;
use App\Models\AlagaLinkSetting;
use App\Models\AlagaLinkUpdate;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class AlagaLinkSeeder extends Seeder
{
    public function run(): void
    {
        $base = database_path('seeders/data/alagalink');

        $users = $this->readJson($base.'/users.json');
        foreach ($users as $user) {
            AlagaLinkProfile::updateOrCreate(
                ['id' => $user['id']],
                [
                    'email' => $user['email'] ?? '',
                    'role' => $user['role'] ?? 'User',
                    'status' => $user['status'] ?? 'Active',
                    'data' => $user,
                ]
            );
        }

        $reports = $this->readJson($base.'/reports.json');
        foreach ($reports as $report) {
            AlagaLinkLostReport::updateOrCreate(
                ['id' => $report['id']],
                [
                    'user_id' => $report['userId'] ?? '',
                    'reporter_id' => $report['reporterId'] ?? '',
                    'status' => $report['status'] ?? 'Pending',
                    'is_posted' => (bool) ($report['isPosted'] ?? false),
                    'data' => $report,
                ]
            );
        }

        $programRecords = $this->readJson($base.'/program_records.json');
        foreach ($programRecords as $record) {
            $dateApplied = $record['dateApplied'] ?? null;

            AlagaLinkProgramAvailment::updateOrCreate(
                ['id' => $record['id']],
                [
                    'user_id' => $record['userId'] ?? '',
                    'program_type' => $record['programType'] ?? '',
                    'title' => $record['title'] ?? '',
                    'status' => $record['status'] ?? 'Pending',
                    'date_applied' => $dateApplied,
                    'data' => $record,
                ]
            );
        }

        $notifications = $this->readJson($base.'/notification_history.json');
        foreach ($notifications as $notification) {
            $date = null;
            if (!empty($notification['date'])) {
                try {
                    $date = Carbon::parse($notification['date']);
                } catch (\Throwable) {
                    $date = null;
                }
            }

            AlagaLinkNotification::updateOrCreate(
                ['id' => $notification['id']],
                [
                    'user_id' => $notification['userId'] ?? null,
                    'target_role' => $notification['targetRole'] ?? null,
                    'title' => $notification['title'] ?? '',
                    'message' => $notification['message'] ?? '',
                    'type' => $notification['type'] ?? 'Info',
                    'date' => $date,
                    'is_read' => (bool) ($notification['isRead'] ?? false),
                    'link' => $notification['link'] ?? null,
                    'program_type' => $notification['programType'] ?? null,
                    'data' => $notification,
                ]
            );
        }

        $devices = $this->readJson($base.'/devices.json');
        foreach ($devices as $device) {
            AlagaLinkProgram::updateOrCreate(
                ['id' => $device['id']],
                [
                    'type' => 'Device',
                    'title' => $device['name'] ?? '',
                    'is_visible' => (bool) ($device['isVisible'] ?? true),
                    'stock_count' => $device['stockCount'] ?? null,
                    'data' => $device,
                ]
            );
        }

        $medical = $this->readJson($base.'/medical.json');
        foreach ($medical as $service) {
            AlagaLinkProgram::updateOrCreate(
                ['id' => $service['id']],
                [
                    'type' => 'Medical',
                    'title' => $service['name'] ?? '',
                    'is_visible' => (bool) ($service['isVisible'] ?? true),
                    'stock_count' => null,
                    'data' => $service,
                ]
            );
        }

        $livelihoods = $this->readJson($base.'/livelihoods.json');
        foreach ($livelihoods as $program) {
            AlagaLinkProgram::updateOrCreate(
                ['id' => $program['id']],
                [
                    'type' => 'Livelihood',
                    'title' => $program['title'] ?? '',
                    'is_visible' => (bool) ($program['isVisible'] ?? true),
                    'stock_count' => null,
                    'data' => $program,
                ]
            );
        }

        $updates = $this->readJson($base.'/updates.json');
        foreach ($updates as $update) {
            // These are numeric in the mock data; normalize to integer.
            $id = (int) ($update['id'] ?? 0);
            if ($id <= 0) {
                continue;
            }

            AlagaLinkUpdate::updateOrCreate(
                ['id' => $id],
                [
                    'title' => $update['title'] ?? '',
                    'date' => $update['date'] ?? '',
                    'summary' => $update['summary'] ?? '',
                    'detail' => $update['detail'] ?? '',
                    'link' => $update['link'] ?? null,
                    'program_type' => $update['programType'] ?? null,
                    'data' => $update,
                ]
            );
        }

        $about = $this->readJson($base.'/about.json');
        AlagaLinkSetting::updateOrCreate(
            ['key' => 'about'],
            ['data' => $about]
        );
    }

    /**
     * @return mixed
     */
    private function readJson(string $path)
    {
        if (!File::exists($path)) {
            throw new \RuntimeException("Missing seed data: {$path}. Run: node scripts/export-alagalink-mockdata.mjs");
        }

        return json_decode(File::get($path), true, flags: JSON_THROW_ON_ERROR);
    }
}
