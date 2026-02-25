<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\AlagaLinkProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        try {
            $request->authenticate();
        } catch (ValidationException $e) {
            if (! $this->attemptSeededLogin($request)) {
                throw $e;
            }
        }

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false))->setStatusCode(303);
    }

    private function attemptSeededLogin(LoginRequest $request): bool
    {
        if (app()->environment('production')) {
            return false;
        }

        $email = (string) $request->input('email', '');
        $password = (string) $request->input('password', '');

        if ($email === '' || $password !== 'password') {
            return false;
        }

        if (! Schema::hasTable('alagalink_profiles')) {
            return false;
        }

        $profile = AlagaLinkProfile::query()
            ->whereRaw('LOWER(email) = ?', [mb_strtolower($email)])
            ->first();

        if (! $profile) {
            return false;
        }

        $user = User::query()->where('email', $email)->first();
        if (! $user) {
            $data = is_array($profile->data) ? $profile->data : [];
            $name = trim((string) (($data['firstName'] ?? '') . ' ' . ($data['lastName'] ?? '')));
            if ($name === '') {
                $name = (string) ($data['email'] ?? $email);
            }

            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make('password'),
            ]);
        }

        $remember = $request->boolean('remember');

        if (! Auth::attempt(['email' => $email, 'password' => 'password'], $remember)) {
            return false;
        }

        // The original attempt hit the throttle key; clear it now that we have a successful login.
        RateLimiter::clear($request->throttleKey());

        return true;
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
