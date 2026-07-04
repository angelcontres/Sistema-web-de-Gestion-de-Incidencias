<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PerformanceLog extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'metrics.performance_logs';

    protected $fillable = [
        'trp',
        'endpoint',
        'metodo',
        'logged_at',
    ];

    protected $casts = [
        'logged_at' => 'datetime',
    ];
}
