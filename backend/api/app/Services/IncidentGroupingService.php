<?php

namespace App\Services;

use App\Models\Incidencia;
use Illuminate\Support\Facades\DB;

class IncidentGroupingService
{
    /**
     * Find a similar incident within 50 meters of the given coordinates
     * that is of the same category/subcategory and is in state "En Revisión" (estado_id = 2).
     *
     * @param int $tipoId
     * @param int $subTipoId
     * @param float $lat
     * @param float $lng
     * @return Incidencia|null
     */
    public function findSimilarIncident(int $tipoId, int $subTipoId, float $lat, float $lng): ?Incidencia
    {
        $radiusKm = 0.05; // 50 meters

        // Register custom SQL math functions if database is SQLite (typically for testing)
        if (DB::getDriverName() === 'sqlite') {
            $pdo = DB::connection()->getPdo();
            $pdo->sqliteCreateFunction('acos', 'acos', 1);
            $pdo->sqliteCreateFunction('cos', 'cos', 1);
            $pdo->sqliteCreateFunction('sin', 'sin', 1);
            $pdo->sqliteCreateFunction('radians', 'deg2rad', 1);
        }

        // Haversine formula in kilometers:
        // 6371 * acos(cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1)) + sin(radians(lat1)) * sin(radians(lat2)))
        return Incidencia::select('reporte_incidencias.*')
            ->join('direcciones', 'reporte_incidencias.direccion_id', '=', 'direcciones.id')
            ->where('reporte_incidencias.tipo_incidencia_id', $tipoId)
            ->where('reporte_incidencias.sub_tipo_incidencia_id', $subTipoId)
            ->where('reporte_incidencias.estado_id', 2) // Only "En Revisión"
            ->whereNull('reporte_incidencias.deleted_at')
            ->selectRaw(
                '(6371 * acos(
                    cos(radians(?)) * cos(radians(direcciones.latitud)) * 
                    cos(radians(direcciones.longitud) - radians(?)) + 
                    sin(radians(?)) * sin(radians(direcciones.latitud))
                )) AS distance',
                [$lat, $lng, $lat]
            )
            ->whereRaw('(6371 * acos(
                cos(radians(?)) * cos(radians(direcciones.latitud)) * 
                cos(radians(direcciones.longitud) - radians(?)) + 
                sin(radians(?)) * sin(radians(direcciones.latitud))
            )) <= ?', [$lat, $lng, $lat, $radiusKm])
            ->orderBy('distance', 'asc')
            ->first();
    }
}
