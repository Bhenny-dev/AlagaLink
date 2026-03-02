<?php

namespace App\Http\Controllers\AlagaLink;

use App\Http\Controllers\Controller;
use App\Models\AlagaLinkProgram;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProgramInventoryController extends Controller
{
    private function ensureAdmin(Request $request): void
    {
        $actor = $request->user();
        if (! $actor) {
            throw ValidationException::withMessages([
                'auth' => ['Unauthenticated.'],
            ]);
        }

        $actorRole = (string) ($actor->alagalink_role ?? 'User');
        if (! in_array($actorRole, ['Admin', 'SuperAdmin'], true)) {
            throw ValidationException::withMessages([
                'auth' => ['Forbidden.'],
            ]);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'id' => ['nullable', 'string', 'max:128'],
            'type' => ['required', Rule::in(['Device', 'Medical', 'Livelihood'])],
            'title' => ['required', 'string', 'max:255'],
            'isVisible' => ['nullable', 'boolean'],
            'stockCount' => ['nullable', 'integer', 'min:0'],
            'data' => ['required', 'array'],
        ]);

        $id = (string) ($data['id'] ?? 'prog-'.(string) Str::ulid());

        $payload = [
            ...$data['data'],
            'id' => $id,
            'isVisible' => (bool) ($data['isVisible'] ?? ($data['data']['isVisible'] ?? true)),
        ];

        $program = AlagaLinkProgram::query()->updateOrCreate(
            ['id' => $id],
            [
                'id' => $id,
                'type' => (string) $data['type'],
                'title' => (string) $data['title'],
                'is_visible' => (bool) ($payload['isVisible'] ?? true),
                'stock_count' => isset($data['stockCount']) ? (int) $data['stockCount'] : (isset($payload['stockCount']) ? (int) $payload['stockCount'] : null),
                'data' => $payload,
            ],
        );

        return response()->json([
            'program' => $program->data,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $program = AlagaLinkProgram::query()->where('id', $id)->first();
        if (! $program) {
            throw ValidationException::withMessages([
                'id' => ['Program not found.'],
            ]);
        }

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'isVisible' => ['nullable', 'boolean'],
            'stockCount' => ['nullable', 'integer', 'min:0'],
            'data' => ['nullable', 'array'],
        ]);

        $existingPayload = is_array($program->data) ? $program->data : [];
        $payload = [
            ...$existingPayload,
            ...($data['data'] ?? []),
        ];

        if (array_key_exists('isVisible', $data)) {
            $payload['isVisible'] = (bool) $data['isVisible'];
        }
        if (array_key_exists('stockCount', $data)) {
            $payload['stockCount'] = $data['stockCount'];
        }
        if (array_key_exists('title', $data) && $data['title'] !== null) {
            $payload['title'] = $data['title'];
            $program->title = (string) $data['title'];
        }

        $program->forceFill([
            'is_visible' => (bool) ($payload['isVisible'] ?? $program->is_visible),
            'stock_count' => array_key_exists('stockCount', $data) ? $data['stockCount'] : $program->stock_count,
            'data' => $payload,
        ])->save();

        return response()->json([
            'program' => $program->data,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $program = AlagaLinkProgram::query()->where('id', $id)->first();
        if (! $program) {
            return response()->json(['deleted' => true]);
        }

        $program->delete();

        return response()->json(['deleted' => true]);
    }
}
