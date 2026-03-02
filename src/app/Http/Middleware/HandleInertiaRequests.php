<?php

namespace App\Http\Middleware;

use App\Models\AlagaLinkLostReport;
use App\Models\AlagaLinkNotification;
use App\Models\AlagaLinkProgram;
use App\Models\AlagaLinkProgramAvailment;
use App\Models\AlagaLinkSetting;
use App\Models\AlagaLinkUpdate;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'alagalink' => fn () => $this->alagaLinkSeed(),
        ];
    }

    /**
     * Provides AlagaLink seed data from the database.
     *
     * Returns null if the tables are not migrated yet.
     *
     * @return array<string, mixed>|null
     */
    private function alagaLinkSeed(): ?array
    {
        try {
            if (!Schema::hasTable('users')) {
                return null;
            }

            $users = User::query()
                ->whereNotNull('alagalink_data')
                ->orderBy('id')
                ->get()
                ->map(function (User $user) {
                    $data = is_array($user->alagalink_data) ? $user->alagalink_data : [];

                    $computedId = (string) ($user->alagalink_id ?: ('laravel-'.$user->id));
                    $computedRole = (string) ($user->alagalink_role ?: 'User');
                    $computedStatus = (string) ($user->alagalink_status ?: 'Pending');

                    $firstName = (string) ($data['firstName'] ?? '');
                    $lastName = (string) ($data['lastName'] ?? '');
                    if ($firstName === '' && $lastName === '') {
                        $parts = preg_split('/\s+/', trim((string) ($user->name ?? '')));
                        $parts = array_values(array_filter($parts ?: []));
                        $firstName = $parts[0] ?? (string) ($user->name ?? 'User');
                        $lastName = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';
                    }

                    return [
                        ...$data,
                        'id' => $computedId,
                        'email' => (string) $user->email,
                        'role' => $data['role'] ?? $computedRole,
                        'status' => $data['status'] ?? $computedStatus,
                        'firstName' => $firstName,
                        'middleName' => $data['middleName'] ?? '',
                        'lastName' => $lastName,
                        'address' => $data['address'] ?? '',
                        'birthDate' => $data['birthDate'] ?? '',
                        'provincialAddress' => $data['provincialAddress'] ?? '',
                        'civilStatus' => $data['civilStatus'] ?? '',
                        'occupation' => $data['occupation'] ?? '',
                        'sex' => $data['sex'] ?? 'Other',
                        'bloodType' => $data['bloodType'] ?? '',
                        'age' => $data['age'] ?? 0,
                        'contactNumber' => $data['contactNumber'] ?? '',
                        'disabilityCategory' => $data['disabilityCategory'] ?? 'N/A (Staff/Admin)',
                        'registrantType' => $data['registrantType'] ?? 'Self',
                        'photoUrl' => $data['photoUrl'] ?? '',
                        'history' => $data['history'] ?? [
                            'lostAndFound' => [],
                            'programs' => [],
                        ],
                        'customData' => $data['customData'] ?? (object) [],
                        'familyComposition' => $data['familyComposition'] ?? [],
                        'emergencyContact' => $data['emergencyContact'] ?? [
                            'name' => '',
                            'relation' => '',
                            'contact' => '',
                        ],
                    ];
                })
                ->values()
                ->all();

            $reports = [];
            if (Schema::hasTable('alagalink_lost_reports')) {
                $reports = AlagaLinkLostReport::query()->orderBy('id')->get()->pluck('data')->all();
            }

            $programRequests = [];
            if (Schema::hasTable('alagalink_program_availments')) {
                $programRequests = AlagaLinkProgramAvailment::query()->orderBy('id')->get()->pluck('data')->all();
            }

            $notifications = [];
            if (Schema::hasTable('alagalink_notifications')) {
                $notifications = AlagaLinkNotification::query()->orderBy('date')->get()->pluck('data')->all();
            }

            $updates = [];
            if (Schema::hasTable('alagalink_updates')) {
                $updates = AlagaLinkUpdate::query()->orderBy('id')->get()->pluck('data')->all();
            }

            $devices = [];
            $medical = [];
            $livelihoods = [];
            if (Schema::hasTable('alagalink_programs')) {
                $devices = AlagaLinkProgram::query()->where('type', 'Device')->orderBy('id')->get()->pluck('data')->all();
                $medical = AlagaLinkProgram::query()->where('type', 'Medical')->orderBy('id')->get()->pluck('data')->all();
                $livelihoods = AlagaLinkProgram::query()->where('type', 'Livelihood')->orderBy('id')->get()->pluck('data')->all();
            }

            $about = null;
            if (Schema::hasTable('alagalink_settings')) {
                $about = AlagaLinkSetting::query()->where('key', 'about')->value('data');
            }

            return [
                'users' => $users,
                'reports' => $reports,
                'programRequests' => $programRequests,
                'notifications' => $notifications,
                'devices' => $devices,
                'medical' => $medical,
                'livelihoods' => $livelihoods,
                'updates' => $updates,
                'about' => $about,
            ];
        } catch (\Throwable) {
            return null;
        }
    }
}
