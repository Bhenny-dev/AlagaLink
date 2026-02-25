<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlagaLinkSetting extends Model
{
    protected $table = 'alagalink_settings';

    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'key',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];
}
