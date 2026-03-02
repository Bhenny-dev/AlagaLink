<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    private function ensureStaffOrAdmin(Request $request): void
    {
        $user = $request->user();
        $role = (string) ($user?->alagalink_role ?? 'User');

        abort_unless(in_array($role, ['Admin', 'SuperAdmin'], true), 403);
    }

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $this->ensureStaffOrAdmin($request);

        $user = $request->user();
        $createdAt = $user->created_at;
        $accountAgeDays = $createdAt ? $createdAt->diffInDays(now()) : 0;

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'stats' => [
                'accountAgeDays' => $accountAgeDays,
                'emailVerified' => (bool) $user->email_verified_at,
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $this->ensureStaffOrAdmin($request);

        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $this->ensureStaffOrAdmin($request);

        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
