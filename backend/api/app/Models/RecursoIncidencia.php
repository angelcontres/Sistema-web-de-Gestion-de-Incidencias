<?php

namespace App\Models;

use App\Traits\HasLocalTimezone;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

#[Table('recurso_incidencias')]
class RecursoIncidencia extends Model
{
    use HasLocalTimezone;

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

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk(env('FILESYSTEM_DISK', 'public'));

        return $disk->url($value);
    }

    public function incidencia(): BelongsTo
    {
        return $this->belongsTo(Incidencia::class, 'incidencia_id');
    }
}
