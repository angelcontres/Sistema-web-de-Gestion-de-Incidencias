<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'username', 'email', 'password', 'activo', 'pais_id', 'institucion_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

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
        foreach ($this->roles()->with('permisos')->get() as $role) {
            foreach ($role->permisos as $permiso) {
                if (strtolower($permiso->nombre) === strtolower($permissionName)) {
                    return true;
                }
            }
        }

        return false;
    }
}
