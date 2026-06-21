<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Override;

#[Fillable(['nombre', 'descripcion', 'padre_id', 'created_by', 'update_by', 'deleted_by'])]
class Role extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Mapeo y conversión de tipos de datos.
     */
    #[Override]
    protected function casts(): array
    {
        return [
            'padre_id'   => 'integer',
            'created_by' => 'integer',
            'update_by'  => 'integer',
            'deleted_by' => 'integer',
        ];
    }

    /**
     * Relación: El usuario que creó este rol.
     */
    public function RoleCreater(): BelongsTo
    {
        // Usamos belongsTo porque el Rol "pertenece a" un usuario creador
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relación: El usuario que modificó este rol por última vez.
     */
    public function RoleEditor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'update_by');
    }

    /*+
     * Relacion el usuario que elimino rol
     */
    public function RoleDeleter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
