<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlagaLinkUpdate extends Model
{
    protected $table = 'alagalink_updates';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $fillable = [
        'id',
        'title',
        'date',
        'summary',
        'detail',
        'link',
        'program_type',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];
}
