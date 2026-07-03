<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nombre', 'codigo_iso', 'activo'])]
class Pais extends Model
{
    use HasFactory;

    protected $table = 'paises';

    /**
     * Mutator para asegurar que el código ISO siempre se guarde en mayúsculas y sin espacios.
     */
    protected function codigoIso(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => strtoupper(trim($value)),
        );
    }

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    /**
     * Relación: Los territorios que pertenecen a este país.
     */
    public function territorios(): HasMany
    {
        return $this->hasMany(Territorio::class, 'pais_id');
    }
}
