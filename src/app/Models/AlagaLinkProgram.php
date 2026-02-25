<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlagaLinkProgram extends Model
{
    protected $table = 'alagalink_programs';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'type',
        'title',
        'is_visible',
        'stock_count',
        'data',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
        'stock_count' => 'integer',
        'data' => 'array',
    ];
}
