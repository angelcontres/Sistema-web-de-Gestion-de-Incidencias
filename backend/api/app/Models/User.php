<?php

namespace App\Models;

use App\Traits\HasLocalTimezone;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id
 * @property string $name
 * @property string $username
 * @property string $email
 * @property bool $activo
 * @property int|null $pais_id
 * @property int|null $institucion_id
 * @property Collection<int, Role> $roles
 * @property Collection<int, Territorio> $territorios
 * @property Pais|null $pais
 * @property Institucion|null $institucion
 */
#[Fillable(['name', 'username', 'email', 'password', 'activo', 'pais_id', 'institucion_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    use HasLocalTimezone;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'pais_id' => 'integer',
            'institucion_id' => 'integer',
        ];
    }

    /**
     * Relación: Los roles asignados a este usuario.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'roles_users', 'user_id', 'rol_id')->withTimestamps();
    }

    /**
     * Relación: El país asignado a este usuario (si es operador).
     */
    public function pais()
    {
        return $this->belongsTo(Pais::class, 'pais_id');
    }

    /**
     * Relación: La institución a la que pertenece el usuario (si es de rol Institución).
     */
    public function institucion()
    {
        return $this->belongsTo(Institucion::class, 'institucion_id');
    }

    /**
     * Relación: Los territorios asignados a este usuario (por ejemplo, cobertura del supervisor).
     */
    public function territorios(): BelongsToMany
    {
        return $this->belongsToMany(Territorio::class, 'usuario_territorios', 'user_id', 'territorio_id')
            ->withTimestamps();
    }

    /**
     * Check if the user has a specific permission.
     */
    public function hasPermission(string $permissionName): bool
    {
        $permissionName = strtoupper($permissionName);

        // Optionally, Admin bypasses all permission checks in some systems,
        // but we'll stick to strictly checking the assigned permissions.

        $this->loadMissing('roles.permisos');

        foreach ($this->roles as $role) {
            foreach ($role->permisos as $permiso) {
                $key = strtoupper($permiso->accion.'_'.$permiso->recurso);
                if ($key === $permissionName) {
                    return true;
                }
            }
        }

        return false;
    }
}
