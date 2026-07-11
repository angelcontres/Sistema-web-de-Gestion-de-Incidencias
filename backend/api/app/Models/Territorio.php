<?php

namespace App\Models;

use App\Enums\TipoTerritorio;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['pais_id', 'parent_id', 'nombre', 'tipo', 'codigo', 'activo'])]
class Territorio extends Model
{
    use HasFactory;

    protected $table = 'territorios';

    protected function casts(): array
    {
        return [
            'pais_id' => 'integer',
            'parent_id' => 'integer',
            'activo' => 'boolean',
            'tipo' => TipoTerritorio::class,
        ];
    }

    /**
     * Relación: El país al que pertenece este territorio.
     */
    public function pais(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_id');
    }

    /**
     * Relación: El territorio padre.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * Relación: Los territorios hijos.
     */
    public function hijos(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /**
     * Relación: Las direcciones asociadas a este territorio.
     */
    public function direcciones(): HasMany
    {
        return $this->hasMany(Direccion::class, 'territorio_id');
    }

    /**
     * Relación: Usuarios/supervisores asignados a este territorio.
     */
    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'usuario_territorios', 'territorio_id', 'user_id')
            ->withTimestamps();
    }

    /**
     * Obtiene todos los IDs de territorios descendientes (incluyendo los iniciales)
     * para un conjunto de IDs de territorio de forma iterativa y eficiente.
     */
    public static function obtenerDescendientesIds(array $territorioIds): array
    {
        if (empty($territorioIds)) {
            return [];
        }

        $allIds = $territorioIds;
        $currentLevelIds = $territorioIds;

        while (! empty($currentLevelIds)) {
            $currentLevelIds = self::whereIn('parent_id', $currentLevelIds)
                ->pluck('id')
                ->toArray();

            if (! empty($currentLevelIds)) {
                $allIds = array_merge($allIds, $currentLevelIds);
            }
        }

        return array_unique($allIds);
    }
}
