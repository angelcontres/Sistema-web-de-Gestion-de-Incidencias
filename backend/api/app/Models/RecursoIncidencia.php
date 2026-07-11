<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Support\Facades\Storage;

class RecursoIncidencia extends Model
{
    protected $table = 'recurso_incidencias';
    protected $fillable = [
        'incidencia_id',
        'url',
        'tipo',
    ];

    /**
     * Accesor para obtener la URL absoluta dinámica del recurso.
     */
    public function getUrlAttribute($value): string
    {
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return Storage::disk(env('FILESYSTEM_DISK', 'public'))->url($value);
    }

    public function incidencia(): BelongsTo
    {
        return $this->belongsTo(Incidencia::class, 'incidencia_id');
    }
}
