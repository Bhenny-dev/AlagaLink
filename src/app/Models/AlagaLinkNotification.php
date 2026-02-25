<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlagaLinkNotification extends Model
{
    protected $table = 'alagalink_notifications';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'target_role',
        'title',
        'message',
        'type',
        'date',
        'is_read',
        'link',
        'program_type',
        'data',
    ];

    protected $casts = [
        'date' => 'datetime',
        'is_read' => 'boolean',
        'data' => 'array',
    ];
}
