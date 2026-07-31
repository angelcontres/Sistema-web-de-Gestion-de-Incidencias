<?php

namespace App\Models;

use App\Traits\HasLocalTimezone;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $nombre
 * @property string|null $siglas
 * @property bool $activo
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property int|null $deleted_by
 */
#[Table('instituciones')]
#[Fillable(['nombre', 'siglas', 'activo', 'created_by', 'updated_by', 'deleted_by'])]
class Institucion extends Model
{
    use HasFactory, SoftDeletes;
    use HasLocalTimezone;

    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function actualizador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function eliminador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function incidenciasApoyo(): BelongsToMany
    {
        return $this->belongsToMany(
            Incidencia::class,
            'incidencia_institucion_apoyo',
            'institucion_id',
            'incidencia_id'
        )->withTimestamps();
    }
}
