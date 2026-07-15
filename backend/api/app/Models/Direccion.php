<?php

namespace App\Models;

use App\Traits\HasLocalTimezone;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['territorio_id', 'detalle', 'referencia', 'codigo_postal', 'latitud', 'longitud', 'precision_gps', 'activo'])]
class Direccion extends Model
{
    use HasLocalTimezone;
    use HasFactory;

    protected $table = 'direcciones';

    protected function casts(): array
    {
        return [
            'territorio_id' => 'integer',
            'activo' => 'boolean',
            'latitud' => 'float',
            'longitud' => 'float',
            'precision_gps' => 'float',
        ];
    }

    /**
     * Relación: El territorio al que pertenece esta dirección.
     */
    public function territorio(): BelongsTo
    {
        return $this->belongsTo(Territorio::class, 'territorio_id');
    }
}
