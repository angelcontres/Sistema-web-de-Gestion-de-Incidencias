<?php

namespace App\Http\Controllers;

use App\Models\Incidencia;
use App\Queries\DashboardMetricsQuery;
use App\Services\TimezoneService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $kpis = $this->calculateKpis();
        $topServices = $this->getTopServices(30);
        $recentIncidents = $this->getRecentIncidents(5);
        $mapMarkers = $this->getMapMarkers();

        return response()->json([
            'kpis' => $kpis,
            'servicios_mas_utilizados' => $topServices,
            'recientes' => $recentIncidents,
            'mapa_reportes' => $mapMarkers,
        ]);
    }

    private function calculateKpis()
    {
        $now = TimezoneService::nowLocal();

        $activas = Incidencia::whereIn('estado_id', [1, 2])->count();

        $nuevasActivas = Incidencia::whereIn('estado_id', [1, 2])
            ->where('created_at', '>=', $now->copy()->setTimezone('UTC')->subHours(2))
            ->count();

        $sinAsignar = Incidencia::whereNull('institucion_id')->count();

        $startOfDay = $now->copy()->startOfDay()->setTimezone('UTC');
        $endOfDay = $now->copy()->endOfDay()->setTimezone('UTC');

        $resueltasHoy = Incidencia::where('estado_id', 4)
            ->whereBetween('updated_at', [$startOfDay, $endOfDay])
            ->count();

        return [
            'activas' => $activas,
            'nuevas_activas_2h' => $nuevasActivas,
            'sin_asignar' => $sinAsignar,
            'resueltas_hoy' => $resueltasHoy,
            'tiempo_respuesta' => '18 min', // Placeholder for average response time si fuera real
        ];
    }

    private function getTopServices($days = 30)
    {
        $startDate = TimezoneService::nowLocal()->subDays($days)->startOfDay()->setTimezone('UTC');

        $totalIncidents = Incidencia::where('created_at', '>=', $startDate)->count();

        if ($totalIncidents === 0) {
            return [];
        }

        $topServices = Incidencia::select('tipo_incidencia_id', DB::raw('count(*) as total'))
            ->where('created_at', '>=', $startDate)
            ->whereNotNull('tipo_incidencia_id')
            ->groupBy('tipo_incidencia_id')
            ->orderByDesc('total')
            ->limit(4)
            ->with('tipo')
            ->get();

        $colors = ['primary', 'warning', 'danger', 'success'];

        return $topServices->map(function ($service, $index) use ($totalIncidents, $colors) {
            $percentage = round(($service->total / $totalIncidents) * 100);

            return [
                'nombre' => $service->tipo ? $service->tipo->nombre : 'Desconocido',
                'porcentaje' => $percentage,
                'color' => $colors[$index % count($colors)],
            ];
        });
    }

    private function getRecentIncidents($limit = 5)
    {
        return Incidencia::with(['tipo', 'estado', 'direccion'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function (Incidencia $incidencia) {
                return [
                    'id' => $incidencia->id,
                    'descripcion' => $incidencia->incidencia_descripcion,
                    'categoria' => $incidencia->tipo ? $incidencia->tipo->nombre : '-',
                    'ubicacion' => $incidencia->direccion ? $incidencia->direccion->detalle : 'Sin dirección',
                    'prioridad' => 'Media',
                    'estado' => $incidencia->estado ? $incidencia->estado->nombre : 'Pendiente',
                    'reportado' => $incidencia->created_at->diffForHumans(),
                ];
            });
    }

    private function getMapMarkers()
    {
        return Incidencia::with('direccion', 'tipo')
            ->whereNotNull('direccion_id')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->filter(function (Incidencia $incidencia) {
                return $incidencia->direccion && $incidencia->direccion->latitud && $incidencia->direccion->longitud;
            })
            ->map(function (Incidencia $incidencia) {
                return [
                    'id' => $incidencia->id,
                    'lat' => $incidencia->direccion->latitud,
                    'lng' => $incidencia->direccion->longitud,
                    'titulo' => $incidencia->incidencia_descripcion,
                    'categoria' => $incidencia->tipo ? $incidencia->tipo->nombre : '',
                ];
            })->values();
    }

    public function metrics(Request $request, DashboardMetricsQuery $metricsQuery)
    {
        $role = $request->query('role', 'Ciudadano');
        $user = $request->user();

        $data = $metricsQuery->getMetrics($role, $user);

        return response()->json($data);
    }
}
