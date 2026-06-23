<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Override;

#[Fillable(['nombre', 'descripcion', 'opcion_menu_id', 'created_by', 'updated_by', 'deleted_by'])]
class Permiso extends Model
{
    use HasFactory, SoftDeletes;

    #[Override]
    protected function casts(): array
    {
        return [
            'opcion_menu_id' => 'integer',
            'created_by' => 'integer',
            'updated_by' => 'integer',
            'deleted_by' => 'integer',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'roles_permisos', 'permiso_id', 'rol_id');
    }

    public function PermisoCreater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function PermisoEditor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function PermisoDeleter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function opcionMenu(): BelongsTo
    {
        return $this->belongsTo(OpcionMenu::class, 'opcion_menu_id');
    }
}
