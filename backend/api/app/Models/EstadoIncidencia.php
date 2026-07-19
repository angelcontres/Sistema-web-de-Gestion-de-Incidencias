<?php

namespace App\Models;

use App\Traits\HasLocalTimezone;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EstadoIncidencia extends Model
{
    use HasFactory, SoftDeletes;
    use HasLocalTimezone;

    protected $table = 'estados_incidencia';

    protected $fillable = [
        'nombre',
    ];
}
