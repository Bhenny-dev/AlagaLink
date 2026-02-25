<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('alagalink_direct_messages', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('thread_key', 191)->index();
            $table->string('sender_id', 64)->index();
            $table->string('recipient_id', 64)->index();
            $table->text('body');
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alagalink_direct_messages');
    }
};
