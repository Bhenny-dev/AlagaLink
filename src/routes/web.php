<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AlagaLink\DirectMessageController;
use App\Http\Controllers\AlagaLink\LostReportController;
use App\Http\Controllers\AlagaLink\NotificationController;
use App\Http\Controllers\AlagaLink\ProgramAvailmentController;
use App\Http\Controllers\AlagaLink\ProgramInventoryController;
use App\Http\Controllers\AlagaLink\UserProfileController;
use App\Http\Controllers\AlagaLink\CustomSectionController;
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

    Route::post('/alagalink/users', [UserProfileController::class, 'store']);
    Route::patch('/alagalink/users/{alagalinkId}', [UserProfileController::class, 'update']);

    Route::post('/alagalink/reports', [LostReportController::class, 'store']);
    Route::patch('/alagalink/reports/{id}', [LostReportController::class, 'update']);

    Route::post('/alagalink/program-availments', [ProgramAvailmentController::class, 'store']);
    Route::patch('/alagalink/program-availments/{id}', [ProgramAvailmentController::class, 'update']);

    Route::patch('/alagalink/notifications/{id}', [NotificationController::class, 'markRead']);
    Route::post('/alagalink/notifications/clear', [NotificationController::class, 'clear']);

    Route::put('/alagalink/custom-sections', [CustomSectionController::class, 'update']);

    Route::post('/alagalink/programs', [ProgramInventoryController::class, 'store']);
    Route::patch('/alagalink/programs/{id}', [ProgramInventoryController::class, 'update']);
    Route::delete('/alagalink/programs/{id}', [ProgramInventoryController::class, 'destroy']);
});

require __DIR__.'/auth.php';
