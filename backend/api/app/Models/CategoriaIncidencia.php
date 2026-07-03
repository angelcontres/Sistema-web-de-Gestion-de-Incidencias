<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['parent_id', 'institucion_id', 'nombre', 'descripcion', 'activo'])]
class CategoriaIncidencia extends Model
{
    use HasFactory;

    protected $table = 'categorias_incidencia';

    protected function casts(): array
    {
        return [
            'parent_id' => 'integer',
            'institucion_id' => 'integer',
            'activo' => 'boolean',
        ];
    }

    /**
     * Relación: La categoría padre.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * Relación: Las subcategorías/categorías hijas.
     */
    public function hijos(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /**
     * Relación: La institución a la que pertenece esta categoría.
     */
    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class);
    }

    /**
     * Determina si esta categoría es un nodo hoja (no tiene hijos).
     * Útil para validar que las incidencias solo se asocien a nodos hoja.
     */
    public function esHoja(): bool
    {
        return ! $this->hijos()->exists();
    }
}
