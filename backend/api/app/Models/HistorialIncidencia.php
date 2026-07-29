<?php

namespace App\Models;

use App\Events\HistorialIncidenciaCreated;
use App\Traits\HasLocalTimezone;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;

#[Table('historial_incidencias')]
class HistorialIncidencia extends Model
{
    use HasLocalTimezone;

    protected $dispatchesEvents = [
        'created' => HistorialIncidenciaCreated::class,
    ];

    protected $fillable = [
        'incidencia_id',
        'estado_id',
        'usuario_id',
        'comentario',
    ];

    public function incidencia()
    {
        return $this->belongsTo(Incidencia::class, 'incidencia_id');
    }

    public function estado()
    {
        return $this->belongsTo(EstadoIncidencia::class, 'estado_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
