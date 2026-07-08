<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistorialIncidencia extends Model
{
    protected $table = 'historial_incidencias';

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
