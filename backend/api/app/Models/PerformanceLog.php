<?php

namespace App\Models;

use App\Traits\HasLocalTimezone;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PerformanceLog extends Model
{
    use HasFactory, SoftDeletes;
    use HasLocalTimezone;

    protected $table = 'performance_logs';

    protected $fillable = [
        'trp',
        'endpoint',
        'metodo',
        'usuario_id',
        'logged_at',
    ];

    protected $casts = [
        'logged_at' => 'datetime',
    ];
}
