<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlagaLinkDirectMessage extends Model
{
    protected $table = 'alagalink_direct_messages';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'thread_key',
        'sender_id',
        'recipient_id',
        'body',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];
}
