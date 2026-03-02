<?php

namespace App\Http\Controllers\AlagaLink;

use App\Http\Controllers\Controller;
use App\Models\AlagaLinkSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CustomSectionController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            throw ValidationException::withMessages([
                'auth' => ['Unauthenticated.'],
            ]);
        }

        $actorRole = (string) ($actor->alagalink_role ?? 'User');
        $isAdmin = in_array($actorRole, ['Admin', 'SuperAdmin'], true);
        if (! $isAdmin) {
            throw ValidationException::withMessages([
                'auth' => ['Forbidden.'],
            ]);
        }

        $data = $request->validate([
            'customSections' => ['required', 'array'],
            'customSections.*.id' => ['required', 'string', 'max:64'],
            'customSections.*.label' => ['required', 'string', 'max:255'],
        ]);

        $sections = $data['customSections'];

        AlagaLinkSetting::query()->updateOrCreate(
            ['key' => 'custom_sections'],
            ['key' => 'custom_sections', 'data' => $sections],
        );

        return response()->json([
            'customSections' => $sections,
        ]);
    }
}
