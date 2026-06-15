<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['nombre', 'icono', 'ruta', 'padre_id', 'created_by', 'updated_by', 'deleted_by'])]
class OpcionMenu extends Model
{
    /** @use HasFactory<\Database\Factories\OpcionMenuFactory> */
    use HasFactory, SoftDeletes;

    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'opciones_menu';

    /**
     * Relacion con la opcion de menu padre.
     */
    public function padre()
    {
        return $this->belongsTo(OpcionMenu::class, 'padre_id');
    }

    /**
     * Relacion con las opciones de menu hijo.
     */
    public function hijos()
    {
        return $this->hasMany(OpcionMenu::class, 'padre_id');
    }

    /**
     * Relacion con el usuario que creo esta opcion.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relacion con el usuario que actualizó esta opcion.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Relacion con el usuario que eliminó esta opcion.
     */
    public function deleter()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    /**
     * El método "booted" del modelo.
     * Maneja automáticamente el establecimiento de los registros de auditoría created_by, updated_by y deleted_by.
     */
    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (auth()->check()) {
                $model->created_by = auth()->id();
            } else {
                // Fallback para migraciones, seeders o comandos de consola
                $model->created_by = $model->created_by ?? 1;
            }
        });

        static::updating(function ($model) {
            if (auth()->check()) {
                $model->updated_by = auth()->id();
            }
        });

        static::deleting(function ($model) {
            if (auth()->check()) {
                $model->deleted_by = auth()->id();
                // Guardar en silencio para prevenir bucles de eventos durante la eliminación
                $model->saveQuietly();
            }
        });
    }
}
