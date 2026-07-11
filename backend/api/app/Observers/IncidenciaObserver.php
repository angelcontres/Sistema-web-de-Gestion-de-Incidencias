<?php

namespace App\Observers;

use App\Models\HistorialIncidencia;
use App\Models\Incidencia;

class IncidenciaObserver
{
    /**
     * Handle the Incidencia "created" event.
     */
    public function created(Incidencia $incidencia): void
    {
        $this->registrarHistorial($incidencia, 'Incidencia reportada');
    }

    /**
     * Handle the Incidencia "updated" event.
     */
    public function updated(Incidencia $incidencia): void
    {
        if ($incidencia->wasChanged('estado_id')) {
            // Check if there is a custom comment sent via request (like in Kanban resolve)
            $comentario = request()->input('comentario_estado', 'Cambio de estado');
            $this->registrarHistorial($incidencia, $comentario);
        }
    }

    /**
     * Registra el historial del estado de la incidencia.
     */
    private function registrarHistorial(Incidencia $incidencia, $comentario = null): void
    {
        $user = auth()->user();

        HistorialIncidencia::create([
            'incidencia_id' => $incidencia->id,
            'estado_id' => $incidencia->estado_id,
            'usuario_id' => $user ? $user->id : null,
            'comentario' => $comentario,
        ]);
    }

    /**
     * Handle the Incidencia "deleted" event.
     */
    public function deleted(Incidencia $incidencia): void
    {
        //
    }

    /**
     * Handle the Incidencia "restored" event.
     */
    public function restored(Incidencia $incidencia): void
    {
        //
    }

    /**
     * Handle the Incidencia "force deleted" event.
     */
    public function forceDeleted(Incidencia $incidencia): void
    {
        //
    }
}
