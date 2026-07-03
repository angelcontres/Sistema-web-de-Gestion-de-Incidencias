<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['pais_id', 'parent_id', 'nombre', 'tipo', 'activo'])]
class Territorio extends Model
{
    use HasFactory;

    protected $table = 'territorios';

    protected function casts(): array
    {
        return [
            'pais_id' => 'integer',
            'parent_id' => 'integer',
            'activo' => 'boolean',
        ];
    }

    /**
     * Relación: El país al que pertenece este territorio.
     */
    public function pais(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_id');
    }

    /**
     * Relación: El territorio padre.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * Relación: Los territorios hijos.
     */
    public function hijos(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /**
     * Relación: Las direcciones asociadas a este territorio.
     */
    public function direcciones(): HasMany
    {
        return $this->hasMany(Direccion::class, 'territorio_id');
    }
}
