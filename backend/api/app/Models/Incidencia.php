<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable([
    'incidencia_descripcion',
    'direccion_id',
    'cliente_id',
    'estado_id',
    'institucion_id',
    'tipo_incidencia_id',
    'sub_tipo_incidencia_id',
    'prioridad_id',
    'cantidad_afectados_incidencia',
    'version',
    'created_by',
    'updated_by',
    'deleted_by'
])]
class Incidencia extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'reporte_incidencias';

    protected function casts(): array
    {
        return [
            'direccion_id' => 'integer',
            'cliente_id' => 'integer',
            'estado_id' => 'integer',
            'institucion_id' => 'integer',
            'tipo_incidencia_id' => 'integer',
            'sub_tipo_incidencia_id' => 'integer',
            'prioridad_id' => 'integer',
            'cantidad_afectados_incidencia' => 'integer',
            'version' => 'integer',
            'created_by' => 'integer',
            'updated_by' => 'integer',
            'deleted_by' => 'integer',
        ];
    }

    /**
     * Relación: La prioridad actual de la incidencia (puede ser recalculada).
     */
    public function prioridad(): BelongsTo
    {
        return $this->belongsTo(Prioridad::class, 'prioridad_id');
    }

    /**
     * Relación: La dirección donde ocurrió la incidencia.
     */
    public function direccion(): BelongsTo
    {
        return $this->belongsTo(Direccion::class, 'direccion_id');
    }

    /**
     * Relación: El usuario que reportó la incidencia (cliente).
     */
    public function cliente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cliente_id');
    }

    /**
     * Relación: El estado actual de la incidencia.
     */
    public function estado(): BelongsTo
    {
        return $this->belongsTo(EstadoIncidencia::class, 'estado_id');
    }

    /**
     * Relación: La institución asignada para atender la incidencia.
     */
    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class, 'institucion_id');
    }

    /**
     * Relación: La categoría principal (tipo) de la incidencia.
     */
    public function tipo(): BelongsTo
    {
        return $this->belongsTo(CategoriaIncidencia::class, 'tipo_incidencia_id');
    }

    /**
     * Relación: La subcategoría (subtipo) de la incidencia.
     */
    public function subTipo(): BelongsTo
    {
        return $this->belongsTo(CategoriaIncidencia::class, 'sub_tipo_incidencia_id');
    }

    /**
     * Relación: Usuarios/operadores asignados a la resolución de la incidencia.
     */
    public function operadores(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'usuario_incidencia', 'reporte_incidencia_id', 'user_id')
                    ->withTimestamps();
    }
}
