<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alagalink_direct_messages', function (Blueprint $table) {
            $table->timestamp('read_at')->nullable()->index()->after('meta');
        });

        // Treat existing messages as already read to avoid backlogged unread badges after deploying.
        DB::table('alagalink_direct_messages')->whereNull('read_at')->update([
            'read_at' => DB::raw('created_at'),
        ]);
    }

    public function down(): void
    {
        Schema::table('alagalink_direct_messages', function (Blueprint $table) {
            $table->dropColumn('read_at');
        });
    }
};
