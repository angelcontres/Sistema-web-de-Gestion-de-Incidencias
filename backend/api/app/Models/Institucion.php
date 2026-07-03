<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['nombre', 'siglas', 'activo', 'created_by', 'updated_by', 'deleted_by'])]
class Institucion extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'instituciones';

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
