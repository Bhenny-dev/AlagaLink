<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlagaLinkLostReport extends Model
{
    protected $table = 'alagalink_lost_reports';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'reporter_id',
        'status',
        'is_posted',
        'data',
    ];

    protected $casts = [
        'is_posted' => 'boolean',
        'data' => 'array',
    ];
}
