<?php

namespace App\Models;

use App\Traits\HasLocalTimezone;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $nombre
 * @property string|null $color_hex
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property int|null $deleted_by
 */
#[Table('prioridades')]
#[Fillable(['nombre', 'color_hex', 'created_by', 'updated_by', 'deleted_by'])]
class Prioridad extends Model
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
}
