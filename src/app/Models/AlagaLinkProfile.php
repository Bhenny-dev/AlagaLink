<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlagaLinkProfile extends Model
{
    protected $table = 'alagalink_profiles';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'email',
        'role',
        'status',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];
}
