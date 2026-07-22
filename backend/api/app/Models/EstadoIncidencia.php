<?php

namespace App\Models;

use App\Traits\HasLocalTimezone;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Table('estados_incidencia')]
class EstadoIncidencia extends Model
{
    use HasFactory, SoftDeletes;
    use HasLocalTimezone;

    protected $fillable = [
        'id',
        'nombre',
    ];
}
