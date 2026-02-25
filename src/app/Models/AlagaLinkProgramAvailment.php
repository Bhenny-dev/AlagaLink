<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlagaLinkProgramAvailment extends Model
{
    protected $table = 'alagalink_program_availments';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'program_type',
        'title',
        'status',
        'date_applied',
        'data',
    ];

    protected $casts = [
        'date_applied' => 'date',
        'data' => 'array',
    ];
}
