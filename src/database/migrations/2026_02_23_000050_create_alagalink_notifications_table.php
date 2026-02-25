<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alagalink_notifications', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('user_id')->nullable()->index();
            $table->string('target_role')->nullable()->index();
            $table->string('title');
            $table->text('message');
            $table->string('type')->index();
            $table->timestamp('date')->nullable();
            $table->boolean('is_read')->default(false);
            $table->string('link')->nullable();
            $table->string('program_type')->nullable();
            $table->json('data')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alagalink_notifications');
    }
};
