<?php

namespace App\Observers;

use App\Models\HistorialIncidencia;
use App\Models\Incidencia;
use Illuminate\Support\Facades\Artisan;

class IncidenciaObserver
{
    /**
     * Handle the Incidencia "creating" event.
     */
    public function creating(Incidencia $incidencia): void
    {
        if (request()->has('fecha_local')) {
            $fechaLocal = request()->input('fecha_local');
            $incidencia->created_at = $fechaLocal;
            $incidencia->updated_at = $fechaLocal;
        }
    }

    /**
     * Handle the Incidencia "updating" event.
     */
    public function updating(Incidencia $incidencia): void
    {
        if (request()->has('fecha_local')) {
            $incidencia->updated_at = request()->input('fecha_local');
        }
    }

    /**
     * Handle the Incidencia "created" event.
     */
    public function created(Incidencia $incidencia): void
    {
        $this->registrarHistorial($incidencia, 'Incidencia reportada');

        // Ejecutar ETL inmediatamente para refrescar dashboards analíticos
        if (! app()->runningUnitTests()) {
            Artisan::call('etl:run');
        }
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

        // Ejecutar ETL inmediatamente para refrescar dashboards analíticos
        if (! app()->runningUnitTests()) {
            Artisan::call('etl:run');
        }
    }

    /**
     * Registra el historial del estado de la incidencia.
     */
    private function registrarHistorial(Incidencia $incidencia, $comentario = null): void
    {
        $user = auth()->user();

        $historial = new HistorialIncidencia([
            'incidencia_id' => $incidencia->id,
            'estado_id' => $incidencia->estado_id,
            'usuario_id' => $user ? $user->id : null,
            'comentario' => $comentario,
        ]);

        if (request()->has('fecha_local')) {
            $fechaLocal = request()->input('fecha_local');
            $historial->created_at = $fechaLocal;
            $historial->updated_at = $fechaLocal;
            $historial->timestamps = false;
        }

        $historial->save();
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
