<?php

namespace App\Services;

use App\Models\Incidencia;
use Illuminate\Support\Facades\DB;

class IncidentGroupingService
{
    /**
     * Find a similar incident within 50 meters of the given coordinates
     * that is of the same category/subcategory and is in state "En Revisión" (estado_id = 2).
     */
    public function findSimilarIncident(int $tipoId, int $subTipoId, float $lat, float $lng): ?Incidencia
    {
        $radiusKm = 0.05; // 50 meters

        $query = Incidencia::select('reporte_incidencias.*')
            ->join('direcciones', 'reporte_incidencias.direccion_id', '=', 'direcciones.id')
            ->where('reporte_incidencias.tipo_incidencia_id', $tipoId)
            ->where('reporte_incidencias.sub_tipo_incidencia_id', $subTipoId)
            ->whereIn('reporte_incidencias.estado_id', [1, 2, 3]) // Pendiente, En Revisión, En Proceso
            ->whereNull('reporte_incidencias.deleted_at');

        if (DB::getDriverName() === 'pgsql') {
            $query->whereRaw('ST_DWithin(direcciones.ubicacion, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)', [$lng, $lat, $radiusKm * 1000])
                ->selectRaw('ST_Distance(direcciones.ubicacion, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) AS distance', [$lng, $lat])
                ->orderBy('distance', 'asc');
        }

        return $query->first();
    }
}
