<?php

namespace App\Http\Controllers;

use App\Models\CategoriaIncidencia;
use App\Models\Direccion;
use App\Models\Institucion;
use App\Models\Pais;
use App\Models\Territorio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CatalogoController extends Controller
{
    /**
     * Obtener listado de países activos.
     */
    public function paises(): JsonResponse
    {
        $paises = Cache::remember('catalogo_paises', now()->addHours(24), function () {
            return Pais::where('activo', true)->orderBy('nombre')->get()->toArray();
        });

        return response()->json($paises);
    }

    /**
     * Obtener listado de territorios activos, opcionalmente filtrados.
     */
    public function territorios(Request $request): JsonResponse
    {
        $paisId = $request->input('pais_id', 'all');
        $parentId = $request->input('parent_id', 'all');
        $cacheKey = "catalogo_territorios_{$paisId}_{$parentId}";

        $territorios = Cache::remember($cacheKey, now()->addHours(24), function () use ($request) {
            $query = Territorio::where('activo', true);

            if ($request->has('pais_id')) {
                $query->where('pais_id', $request->input('pais_id'));
            }

            if ($request->has('parent_id')) {
                $parentId = $request->input('parent_id');
                if ($parentId === 'null' || $parentId === null || $parentId === '') {
                    $query->whereNull('parent_id');
                } else {
                    $query->where('parent_id', $parentId);
                }
            }

            return $query->orderBy('nombre')->get()->toArray();
        });

        return response()->json($territorios);
    }

    /**
     * Obtener listado de direcciones activas, opcionalmente filtradas.
     */
    public function direcciones(Request $request): JsonResponse
    {
        $territorioId = $request->input('territorio_id', 'all');
        $cacheKey = "catalogo_direcciones_{$territorioId}";

        $direcciones = Cache::remember($cacheKey, now()->addHours(24), function () use ($request) {
            $query = Direccion::where('activo', true);

            if ($request->has('territorio_id')) {
                $query->where('territorio_id', $request->input('territorio_id'));
            }

            return $query->get()->toArray();
        });

        return response()->json($direcciones);
    }

    /**
     * Obtener listado de categorías de incidencia activas, opcionalmente filtradas.
     * Soporta filtrar por parent_id y obtener únicamente nodos hoja (solo_hojas = true).
     */
    public function categoriasIncidencia(Request $request): JsonResponse
    {
        $parentId = $request->input('parent_id', 'all');
        $soloHojas = $request->boolean('solo_hojas') ? '1' : '0';
        $cacheKey = "catalogo_categorias_incidencia_{$parentId}_{$soloHojas}";

        $categorias = Cache::remember($cacheKey, now()->addHours(24), function () use ($request) {
            $query = CategoriaIncidencia::where('activo', true);

            if ($request->has('parent_id')) {
                $parentId = $request->input('parent_id');
                if ($parentId === 'null' || $parentId === null || $parentId === '') {
                    $query->whereNull('parent_id');
                } else {
                    $query->where('parent_id', $parentId);
                }
            }

            if ($request->boolean('solo_hojas')) {
                $query->whereDoesntHave('hijos');
            }

            return $query->orderBy('nombre')->get()->toArray();
        });

        return response()->json($categorias);
    }

    /**
     * Obtener listado de instituciones activas.
     */
    public function instituciones(): JsonResponse
    {
        $instituciones = Cache::remember('catalogo_instituciones', now()->addHours(24), function () {
            return Institucion::where('activo', true)->orderBy('nombre')->get()->toArray();
        });

        return response()->json($instituciones);
    }
}
