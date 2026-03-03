<?php

namespace Database\Seeders;

use App\Models\AlagaLinkLostReport;
use App\Models\AlagaLinkNotification;
use App\Models\AlagaLinkProgram;
use App\Models\AlagaLinkProgramAvailment;
use App\Models\AlagaLinkSetting;
use App\Models\AlagaLinkUpdate;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class AlagaLinkSeeder extends Seeder
{
    public function run(): void
    {
        $base = database_path('seeders/data/alagalink');

        $targetRegistryUsers = 500;
        $targetActive = 350;
        $targetPending = 100;
        $targetSuspended = 50;

        $targetSeedProgramAvailments = 650;
        $targetSeedLostReports = 40;

        // Seed program catalogs first so any seeded requests can reference real items.
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

        // Seed USERS via the real `users` table (no more `alagalink_profiles`).
        // Registry users are identified by `alagalink_data` and `LT-PWD-*` ids.
        $existingRegistryQuery = User::query()
            ->whereNotNull('alagalink_data')
            ->where('alagalink_role', 'User')
            ->where('alagalink_id', 'like', 'LT-PWD-%');

        $existingRegistryPwdUsers = (int) $existingRegistryQuery->count();

        $existingByStatus = User::query()
            ->whereNotNull('alagalink_data')
            ->where('alagalink_role', 'User')
            ->where('alagalink_id', 'like', 'LT-PWD-%')
            ->selectRaw("COALESCE(alagalink_status, 'Pending') AS s, COUNT(*) AS c")
            ->groupBy('s')
            ->pluck('c', 's')
            ->all();

        $existingActive = (int) ($existingByStatus['Active'] ?? 0);
        $existingPending = (int) ($existingByStatus['Pending'] ?? 0);
        $existingSuspended = (int) ($existingByStatus['Suspended'] ?? 0);

        $missingActive = max(0, $targetActive - $existingActive);
        $missingPending = max(0, $targetPending - $existingPending);
        $missingSuspended = max(0, $targetSuspended - $existingSuspended);

        $totalRegistryAfterTargets = $existingRegistryPwdUsers + $missingActive + $missingPending + $missingSuspended;
        if ($totalRegistryAfterTargets < $targetRegistryUsers) {
            $missingActive += ($targetRegistryUsers - $totalRegistryAfterTargets);
        }

        $maxExistingNumber = 1000;
        $existingIds = User::query()
            ->where('alagalink_role', 'User')
            ->whereNotNull('alagalink_id')
            ->where('alagalink_id', 'like', 'LT-PWD-%')
            ->pluck('alagalink_id')
            ->filter(fn ($v) => is_string($v))
            ->values()
            ->all();
        foreach ($existingIds as $existingId) {
            if (preg_match('/LT-PWD-(\d+)/', $existingId, $m)) {
                $n = (int) $m[1];
                if ($n > $maxExistingNumber) {
                    $maxExistingNumber = $n;
                }
            }
        }

        $faker = fake();
        $createRegistryUser = function (int $number, string $status) use ($faker): void {
            $id = 'LT-PWD-'.$number;
            $email = 'pwd'.$number.'@example.com';

                // Avoid overriding existing accounts.
                if (User::query()->where('email', $email)->exists() || User::query()->where('alagalink_id', $id)->exists()) {
                    return;
                }

                // Use only Male/Female for seeded member avatars so the picture matches.
                $sex = $faker->randomElement(['Male', 'Female']);
                $firstName = $sex === 'Female' ? $faker->firstNameFemale() : $faker->firstNameMale();
                $lastName = $faker->lastName();
                $birthDate = $faker->dateTimeBetween('-70 years', '-18 years')->format('Y-m-d');
                $age = (int) Carbon::parse($birthDate)->diffInYears(Carbon::now());

                $disabilityCategory = $faker->randomElement([
                    'Autism',
                    'Deafness',
                    'Hearing Impairment',
                    'Intellectual Disability',
                    'Multiple Disabilities',
                    'Orthopedic Impairment',
                    'Visual Impairment',
                    'Other Health Impairment',
                ]);

                $profile = [
                    'id' => $id,
                    'email' => $email,
                    'role' => 'User',
                    'firstName' => $firstName,
                    'middleName' => '',
                    'lastName' => $lastName,
                    'address' => $faker->streetAddress().', La Trinidad, Benguet',
                    'birthDate' => $birthDate,
                    'provincialAddress' => 'Benguet',
                    'civilStatus' => $faker->randomElement(['Single', 'Married', 'Separated', 'Widowed']),
                    'occupation' => $faker->jobTitle(),
                    'sex' => $sex,
                    'bloodType' => $faker->randomElement(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']),
                    'age' => $age,
                    'contactNumber' => $faker->numerify('09#########'),
                    'disabilityCategory' => $disabilityCategory,
                    'familyComposition' => [],
                    'emergencyContact' => [
                        'name' => $faker->name(),
                        'relation' => $faker->randomElement(['Parent', 'Sibling', 'Spouse', 'Guardian']),
                        'contact' => $faker->numerify('09#########'),
                    ],
                    'registrantType' => 'Self',
                    'status' => 'Active',
                    // Static public avatar CDN; gendered so it matches the seeded profile.
                    'photoUrl' => 'https://randomuser.me/api/portraits/'.($sex === 'Female' ? 'women' : 'men').'/'.$faker->numberBetween(0, 99).'.jpg',
                    'customData' => (object) [],
                    'history' => [
                        'lostAndFound' => [],
                        'programs' => [],
                    ],
                ];

                $profile['status'] = $status;

                User::query()->create([
                    'name' => trim($firstName.' '.$lastName),
                    'email' => $email,
                    // `password` is cast to "hashed" on the User model.
                    'password' => 'password',
                    'alagalink_id' => $id,
                    'alagalink_role' => 'User',
                    'alagalink_status' => $status,
                    'alagalink_data' => $profile,
                ]);

        };

        // Create missing registry users per status bucket.
        $nextNumber = $maxExistingNumber + 1;
        for ($i = 0; $i < $missingActive; $i++) {
            $createRegistryUser($nextNumber++, 'Active');
        }
        for ($i = 0; $i < $missingPending; $i++) {
            $createRegistryUser($nextNumber++, 'Pending');
        }
        for ($i = 0; $i < $missingSuspended; $i++) {
            $createRegistryUser($nextNumber++, 'Suspended');
        }

        // Registry users are the only ones surfaced to the AlagaLink UI (via HandleInertiaRequests).
        // Program requests should link to these IDs so everything is joinable client-side.
        $registryUsers = User::query()
            ->where('alagalink_role', 'User')
            ->whereNotNull('alagalink_data')
            ->whereNotNull('alagalink_id')
            ->where('alagalink_id', 'like', 'LT-PWD-%')
            ->orderBy('id')
            ->get(['alagalink_id', 'alagalink_status', 'alagalink_data']);

        $userIds = $registryUsers
            ->pluck('alagalink_id')
            ->filter(fn ($v) => is_string($v) && $v !== '')
            ->values()
            ->all();

        $activeUserIds = $registryUsers
            ->filter(fn (User $u) => (string) ($u->alagalink_status ?? '') === 'Active')
            ->pluck('alagalink_id')
            ->filter(fn ($v) => is_string($v) && $v !== '')
            ->values()
            ->all();

        $reporterIds = User::query()
            ->whereIn('alagalink_role', ['Admin', 'SuperAdmin'])
            ->whereNotNull('alagalink_id')
            ->pluck('alagalink_id')
            ->filter(fn ($v) => is_string($v) && $v !== '')
            ->values()
            ->all();

        $pickUserId = function () use ($userIds): string {
            if (count($userIds) === 0) {
                return 'UNKNOWN';
            }

            return (string) $userIds[array_rand($userIds)];
        };

        $pickActiveUserId = function () use ($activeUserIds, $pickUserId): string {
            if (count($activeUserIds) === 0) {
                return $pickUserId();
            }

            return (string) $activeUserIds[array_rand($activeUserIds)];
        };

        $pickReporterId = function () use ($reporterIds): string {
            if (count($reporterIds) === 0) {
                return 'OFFICE';
            }

            return (string) $reporterIds[array_rand($reporterIds)];
        };

        // Intentionally do not seed Lost & Found reports by default.
        // This keeps the Lost & Found section empty unless real reports are created.

        $existingSeedAvailments = AlagaLinkProgramAvailment::query()->where('id', 'like', 'seed-pa-%')->count();
        if ($existingSeedAvailments < $targetSeedProgramAvailments && count($userIds) > 0) {
            $programTypes = ['ID', 'Device', 'Medical', 'PhilHealth', 'Livelihood'];
            $statusOptions = ['Pending', 'Approved', 'Rejected', 'Completed', 'Ready for Claiming', 'Out for Delivery'];

            $toCreate = $targetSeedProgramAvailments - (int) $existingSeedAvailments;
            for ($i = 0; $i < $toCreate; $i++) {
                $id = 'seed-pa-'.Str::ulid();
                $userId = $faker->boolean(75) ? $pickActiveUserId() : $pickUserId();
                $type = $faker->randomElement($programTypes);
                $status = $faker->randomElement($statusOptions);
                $dateApplied = Carbon::now()->subDays($faker->numberBetween(0, 120))->format('Y-m-d');

                $requestedItemId = null;

                if ($type === 'Device' && count($devices) > 0) {
                    $item = $faker->randomElement($devices);
                    $title = (string) ($item['name'] ?? 'Assistive Device Request');
                    $requestedItemId = (string) ($item['id'] ?? null);
                } elseif ($type === 'Medical' && count($medical) > 0) {
                    $item = $faker->randomElement($medical);
                    $title = (string) ($item['name'] ?? 'Medical Assistance');
                    $requestedItemId = (string) ($item['id'] ?? null);
                } elseif ($type === 'Livelihood' && count($livelihoods) > 0) {
                    $item = $faker->randomElement($livelihoods);
                    $title = (string) ($item['title'] ?? 'Livelihood Support');
                    $requestedItemId = (string) ($item['id'] ?? null);
                } else {
                    $title = match ($type) {
                        'ID' => 'PWD ID Application',
                        'PhilHealth' => 'PhilHealth Enrollment',
                        default => 'Program Request',
                    };
                }

                $payload = [
                    'id' => $id,
                    'userId' => $userId,
                    'programType' => $type,
                    'title' => $title,
                    'status' => $status,
                    'dateApplied' => $dateApplied,
                    'details' => $faker->sentence(10),
                ];

                if (is_string($requestedItemId) && $requestedItemId !== '') {
                    $payload['requestedItemId'] = $requestedItemId;
                }

                if ($type === 'PhilHealth') {
                    $payload['philhealthConsent'] = (bool) $faker->boolean(80);
                }

                if ($type === 'ID') {
                    $payload['paymentStatus'] = $faker->randomElement(['Unpaid', 'Paid']);
                    $payload['paymentMethod'] = $faker->randomElement(['Online', 'Upon Claiming']);
                }

                AlagaLinkProgramAvailment::query()->create([
                    'id' => $id,
                    'user_id' => $userId,
                    'program_type' => $type,
                    'title' => $title,
                    'status' => $status,
                    'date_applied' => $dateApplied,
                    'data' => $payload,
                ]);
            }
        }

        // Seed a proportional set of Lost & Found cases (editable in-app; not permanent).
        $existingSeedLostReports = AlagaLinkLostReport::query()->where('id', 'like', 'seed-lr-%')->count();
        if ($existingSeedLostReports < $targetSeedLostReports && count($userIds) > 0) {
            $toCreate = $targetSeedLostReports - (int) $existingSeedLostReports;
            $bodyTypes = ['Slim', 'Average', 'Chubby', 'Athletic', 'Large Build'];
            $clothes = ['Red shirt', 'Blue jacket', 'White blouse', 'Black hoodie', 'Green polo', 'Denim jeans'];
            $places = ['Km. 5 Market', 'Municipal Hall', 'Poblacion', 'Balili', 'Betag', 'Wangal'];

            for ($i = 0; $i < $toCreate; $i++) {
                $reportId = 'seed-lr-'.Str::ulid();
                $userId = $faker->boolean(80) ? $pickActiveUserId() : $pickUserId();
                $reporterId = $pickReporterId();

                /** @var User|null $u */
                $u = $registryUsers->first(fn (User $x) => (string) $x->alagalink_id === (string) $userId);
                $uData = ($u && is_array($u->alagalink_data)) ? $u->alagalink_data : [];
                $name = trim(((string) ($uData['firstName'] ?? '')) .' '. ((string) ($uData['lastName'] ?? '')));
                if ($name === '') {
                    $name = (string) $userId;
                }

                $status = $faker->randomElement(['Missing', 'Found', 'Pending']);
                $timeMissing = Carbon::now()->subHours($faker->numberBetween(2, 240))->toISOString();

                $payload = [
                    'id' => $reportId,
                    'userId' => $userId,
                    'name' => $name,
                    'reporterId' => $reporterId,
                    'timeMissing' => $timeMissing,
                    'lastSeen' => $faker->randomElement($places),
                    'description' => $faker->sentence(18),
                    'clothes' => $faker->randomElement($clothes),
                    'height' => $faker->randomElement(['4\'11\"', '5\'1\"', '5\'3\"', '5\'6\"', '5\'8\"']),
                    'bodyType' => $faker->randomElement($bodyTypes),
                    'dissemination' => [
                        'radio' => (bool) $faker->boolean(25),
                        'socialMedia' => true,
                        'context' => 'Seeded case for demo/testing.',
                    ],
                    'status' => $status,
                    'isPosted' => (bool) $faker->boolean(30),
                    'photoUrl' => (string) ($uData['photoUrl'] ?? ''),
                ];

                AlagaLinkLostReport::query()->create([
                    'id' => $reportId,
                    'user_id' => $userId,
                    'reporter_id' => $reporterId,
                    'status' => $status,
                    'is_posted' => (bool) $payload['isPosted'],
                    'data' => $payload,
                ]);
            }
        }

        // Keep each user's embedded history in sync with the backing tables.
        // This ensures seeded records match what the Programs + Lost&Found views show.
        $availmentsByUser = AlagaLinkProgramAvailment::query()
            ->orderBy('date_applied')
            ->get()
            ->groupBy('user_id');

        $lostReportsByUser = collect();
        if (\Illuminate\Support\Facades\Schema::hasTable('alagalink_lost_reports')) {
            $lostReportsByUser = AlagaLinkLostReport::query()
                ->orderBy('created_at')
                ->get()
                ->groupBy('user_id');
        }

        User::query()
            ->where('alagalink_role', 'User')
            ->whereNotNull('alagalink_id')
            ->whereNotNull('alagalink_data')
            ->orderBy('id')
            ->chunkById(100, function ($users) use ($availmentsByUser, $lostReportsByUser) {
                foreach ($users as $user) {
                    $alagalinkId = (string) ($user->alagalink_id ?? '');
                    if ($alagalinkId === '') {
                        continue;
                    }

                    $historyPrograms = $availmentsByUser->get($alagalinkId, collect())
                        ->pluck('data')
                        ->values()
                        ->all();

                    $historyLost = $lostReportsByUser->get($alagalinkId, collect())
                        ->pluck('data')
                        ->values()
                        ->all();

                    $data = is_array($user->alagalink_data) ? $user->alagalink_data : [];
                    $history = is_array($data['history'] ?? null) ? $data['history'] : [];

                    $history['programs'] = $historyPrograms;
                    $history['lostAndFound'] = $historyLost;
                    $data['history'] = $history;

                    $user->forceFill(['alagalink_data' => $data])->save();
                }
            });

        if (AlagaLinkNotification::query()->count() === 0) {
            $faker = fake();
            $types = ['Info', 'Success', 'Warning', 'Urgent'];

            $staffRoles = ['Admin', 'SuperAdmin'];
            $userProgramTypes = ['ID', 'Device', 'Medical', 'PhilHealth', 'Livelihood'];

            for ($i = 0; $i < 18; $i++) {
                $id = 'notif-'.Str::ulid();
                $targetUser = $faker->boolean(60);
                $userId = $targetUser ? $pickUserId() : null;
                $targetRole = $targetUser ? null : $faker->randomElement(['User', ...$staffRoles]);
                $type = $faker->randomElement($types);
                $date = Carbon::now()->subDays($faker->numberBetween(0, 45));

                $programType = $faker->randomElement($userProgramTypes);

                // Seed notifications should be actionable so the UI feels “real”.
                // Use existing deep link conventions: "page:section:itemId" or "page:section".
                $link = null;
                $title = '';
                $message = '';

                if ($userId !== null) {
                    // Member-facing examples.
                    $title = $faker->randomElement([
                        'Application Update',
                        'Request Logged',
                        'Registry Reminder',
                    ]);

                    if ($title === 'Application Update') {
                        $message = "Your {$programType} application has an update. Review your program portal for details.";
                        $link = "programs:{$programType}";
                    } elseif ($title === 'Request Logged') {
                        $message = "We received your {$programType} request. It is now queued for evaluation.";
                        $link = "programs:{$programType}";
                    } else {
                        $message = 'Please keep your profile information up to date to avoid processing delays.';
                        $link = 'profile';
                    }
                } else {
                    // Role-facing examples.
                    if ($targetRole === 'Admin') {
                        $title = $faker->randomElement(['New Evaluation Pending', 'Queue Alert']);
                        $message = "A new {$programType} request requires review. Open Programs to evaluate.";
                        $link = 'programs';
                    } elseif ($targetRole === 'SuperAdmin') {
                        $title = $faker->randomElement(['Staff Oversight', 'System Notice']);
                        $message = 'A staff-level action may need your attention. Review Members to proceed.';
                        $link = 'members:Staff';
                    } else {
                        $title = $faker->randomElement(['Community Update', 'Registry Notice']);
                        $message = "New updates are available in your Programs portal.";
                        $link = "programs:{$programType}";
                    }
                }

                $payload = [
                    'id' => $id,
                    'userId' => $userId,
                    'targetRole' => $targetRole,
                    'title' => $title,
                    'message' => $message,
                    'type' => $type,
                    'date' => $date->toISOString(),
                    'isRead' => (bool) $faker->boolean(30),
                    'link' => $link,
                    'programType' => $faker->boolean(60) ? $programType : null,
                ];

                AlagaLinkNotification::query()->create([
                    'id' => $id,
                    'user_id' => $userId,
                    'target_role' => $targetRole,
                    'title' => (string) $payload['title'],
                    'message' => (string) $payload['message'],
                    'type' => $type,
                    'date' => $date,
                    'is_read' => (bool) $payload['isRead'],
                    'link' => $link,
                    'program_type' => $payload['programType'],
                    'data' => $payload,
                ]);
            }
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
