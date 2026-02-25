<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AlagaLink\DirectMessageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->name('dashboard');
    Route::get('/members', fn () => Inertia::render('Members'))->name('members');
    Route::get('/programs', fn () => Inertia::render('Programs'))->name('programs');
    Route::get('/lost-found', fn () => Inertia::render('LostFound'))->name('lost-found');
    Route::get('/identity-profile', fn () => Inertia::render('IdentityProfile'))->name('identity-profile');
    Route::get('/about', fn () => Inertia::render('About'))->name('about');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware('auth')->prefix('api')->group(function () {
    Route::get('/direct-messages/thread/{peerId}', [DirectMessageController::class, 'thread']);
    Route::post('/direct-messages', [DirectMessageController::class, 'store']);
});

require __DIR__.'/auth.php';
