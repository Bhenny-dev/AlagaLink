<?php

namespace App\Http\Middleware;

use App\Models\AlagaLinkLostReport;
use App\Models\AlagaLinkNotification;
use App\Models\AlagaLinkProfile;
use App\Models\AlagaLinkProgram;
use App\Models\AlagaLinkProgramAvailment;
use App\Models\AlagaLinkSetting;
use App\Models\AlagaLinkUpdate;
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
            if (!Schema::hasTable('alagalink_profiles')) {
                return null;
            }

            $users = AlagaLinkProfile::query()->orderBy('id')->get()->pluck('data')->all();
            $reports = AlagaLinkLostReport::query()->orderBy('id')->get()->pluck('data')->all();
            $programRequests = AlagaLinkProgramAvailment::query()->orderBy('id')->get()->pluck('data')->all();
            $notifications = AlagaLinkNotification::query()->orderBy('date')->get()->pluck('data')->all();
            $updates = AlagaLinkUpdate::query()->orderBy('id')->get()->pluck('data')->all();

            $devices = AlagaLinkProgram::query()->where('type', 'Device')->orderBy('id')->get()->pluck('data')->all();
            $medical = AlagaLinkProgram::query()->where('type', 'Medical')->orderBy('id')->get()->pluck('data')->all();
            $livelihoods = AlagaLinkProgram::query()->where('type', 'Livelihood')->orderBy('id')->get()->pluck('data')->all();

            $about = AlagaLinkSetting::query()->where('key', 'about')->value('data');

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
