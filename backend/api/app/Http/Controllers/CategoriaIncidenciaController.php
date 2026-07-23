<?php

namespace App\Http\Controllers;

use App\Models\CategoriaIncidencia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoriaIncidenciaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = CategoriaIncidencia::with(['parent']);

        if ($request->has('parent_id')) {
            $parentId = $request->input('parent_id');
            if ($parentId === 'null' || $parentId === null || $parentId === '') {
                $query->whereNull('parent_id');
            } else {
                $query->where('parent_id', $parentId);
            }
        }

        if ($request->query('all') === 'true' || $request->query('all') === '1') {
            return response()->json($query->orderBy('nombre')->get(), 200);
        }

        $perPage = $request->input('per_page', 15);

        return response()->json($query->orderBy('nombre')->paginate($perPage), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:1000',
            'parent_id' => 'nullable|exists:categorias_incidencia,id',
            'activo' => 'boolean',
        ]);

        $categoria = CategoriaIncidencia::create([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'parent_id' => $request->parent_id,
            'activo' => $request->input('activo', true),
        ]);

        return response()->json([
            'message' => 'Categoría de incidencia creada con éxito',
            'data' => $categoria->load('parent'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id): JsonResponse
    {
        $categoria = CategoriaIncidencia::with(['parent', 'hijos'])->findOrFail($id);

        return response()->json($categoria, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $categoria = CategoriaIncidencia::findOrFail($id);

        $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string|max:1000',
            'parent_id' => 'nullable|exists:categorias_incidencia,id|different:id',
            'activo' => 'boolean',
        ]);

        // Prevent circular dependency (cannot set a child as parent)
        if ($request->filled('parent_id')) {
            $parentId = $request->input('parent_id');
            if ($this->isDescendant($categoria->id, $parentId)) {
                return response()->json([
                    'message' => 'No se puede asignar una subcategoría como categoría padre.',
                ], 422);
            }
        }

        $categoria->update($request->only(['nombre', 'descripcion', 'parent_id', 'activo']));

        return response()->json([
            'message' => 'Categoría de incidencia actualizada con éxito',
            'data' => $categoria->load('parent'),
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id): JsonResponse
    {
        $categoria = CategoriaIncidencia::findOrFail($id);

        if ($categoria->hijos()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar la categoría porque tiene subcategorías asociadas.',
            ], 400);
        }

        $categoria->delete();

        return response()->json([
            'message' => 'Categoría de incidencia eliminada con éxito',
        ], 200);
    }

    /**
     * Helper to check if a category is a descendant of another.
     */
    private function isDescendant($parentId, $childId, $allCategories = null): bool
    {
        if (is_null($allCategories)) {
            $allCategories = CategoriaIncidencia::all();
        }

        $hijos = $allCategories->where('parent_id', $parentId);
        foreach ($hijos as $hijo) {
            if ($hijo->id == $childId) {
                return true;
            }
            if ($this->isDescendant($hijo->id, $childId, $allCategories)) {
                return true;
            }
        }

        return false;
    }
}
