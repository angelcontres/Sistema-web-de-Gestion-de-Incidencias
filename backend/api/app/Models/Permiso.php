<?php

namespace App\Models;

use App\Traits\HasLocalTimezone;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Override;

/**
 * @property int $id
 * @property string $nombre
 * @property string $accion
 * @property string $recurso
 * @property int|null $opcion_menu_id
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property int|null $deleted_by
 * @property Collection<int, Role> $roles
 * @property OpcionMenu|null $opcionMenu
 */
#[Fillable(['nombre', 'accion', 'recurso', 'opcion_menu_id', 'created_by', 'updated_by', 'deleted_by'])]
class Permiso extends Model
{
    use HasFactory, SoftDeletes;
    use HasLocalTimezone;

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
