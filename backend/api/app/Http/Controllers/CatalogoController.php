<?php

namespace App\Http\Controllers;

use App\Models\Direccion;
use App\Models\Pais;
use App\Models\CategoriaIncidencia;
use App\Models\Territorio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogoController extends Controller
{
    /**
     * Obtener listado de países activos.
     */
    public function paises(): JsonResponse
    {
        $paises = Pais::where('activo', true)->orderBy('nombre')->get();
        return response()->json($paises);
    }

    /**
     * Obtener listado de territorios activos, opcionalmente filtrados.
     */
    public function territorios(Request $request): JsonResponse
    {
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

        $territorios = $query->orderBy('nombre')->get();
        return response()->json($territorios);
    }

    /**
     * Obtener listado de direcciones activas, opcionalmente filtradas.
     */
    public function direcciones(Request $request): JsonResponse
    {
        $query = Direccion::where('activo', true);

        if ($request->has('territorio_id')) {
            $query->where('territorio_id', $request->input('territorio_id'));
        }

        $direcciones = $query->get();
        return response()->json($direcciones);
    }

    /**
     * Obtener listado de categorías de incidencia activas, opcionalmente filtradas.
     * Soporta filtrar por parent_id y obtener únicamente nodos hoja (solo_hojas = true).
     */
    public function categoriasIncidencia(Request $request): JsonResponse
    {
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

        $categorias = $query->orderBy('nombre')->get();
        return response()->json($categorias);
    }
}
