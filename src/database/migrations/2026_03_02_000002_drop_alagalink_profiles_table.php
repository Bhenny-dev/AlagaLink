<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('alagalink_profiles');
    }

    public function down(): void
    {
        Schema::create('alagalink_profiles', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('email')->index();
            $table->string('role')->index();
            $table->string('status')->index();
            $table->json('data');
            $table->timestamps();
        });
    }
};
