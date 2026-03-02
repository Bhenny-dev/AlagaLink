<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('alagalink_id', 64)->nullable()->unique()->after('id');
            $table->string('alagalink_role', 32)->default('User')->index()->after('remember_token');
            $table->string('alagalink_status', 32)->default('Pending')->index()->after('alagalink_role');
            $table->json('alagalink_data')->nullable()->after('alagalink_status');
        });

        // Backfill existing users with a stable string id.
        User::query()
            ->whereNull('alagalink_id')
            ->orderBy('id')
            ->chunkById(200, function ($users) {
                foreach ($users as $user) {
                    $user->forceFill([
                        'alagalink_id' => 'laravel-'.$user->id,
                    ])->save();
                }
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['alagalink_id']);
            $table->dropIndex(['alagalink_role']);
            $table->dropIndex(['alagalink_status']);

            $table->dropColumn(['alagalink_id', 'alagalink_role', 'alagalink_status', 'alagalink_data']);
        });
    }
};
