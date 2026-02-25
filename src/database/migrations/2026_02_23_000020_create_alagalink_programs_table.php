<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alagalink_programs', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('type')->index();
            $table->string('title')->index();
            $table->boolean('is_visible')->default(true);
            $table->unsignedInteger('stock_count')->nullable();
            $table->json('data');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alagalink_programs');
    }
};
