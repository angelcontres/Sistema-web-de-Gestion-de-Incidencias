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
            // PostGIS nativo: utiliza el índice espacial (ST_DWithin toma la distancia en metros)
            $query->whereRaw("ST_DWithin(direcciones.ubicacion, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)", [$lng, $lat, $radiusKm * 1000])
                  ->selectRaw('ST_Distance(direcciones.ubicacion, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) AS distance', [$lng, $lat])
                  ->orderBy('distance', 'asc');
        } else {
            // SQLite (Testing) Fallback
            if (DB::getDriverName() === 'sqlite') {
                $pdo = DB::connection()->getPdo();
                $pdo->sqliteCreateFunction('acos', 'acos', 1);
                $pdo->sqliteCreateFunction('cos', 'cos', 1);
                $pdo->sqliteCreateFunction('sin', 'sin', 1);
                $pdo->sqliteCreateFunction('radians', 'deg2rad', 1);
            }

            $query->selectRaw(
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
            )) <= CAST(? AS REAL)', [$lat, $lng, $lat, $radiusKm])
            ->orderBy('distance', 'asc');
        }

        return $query->first();
    }
}
