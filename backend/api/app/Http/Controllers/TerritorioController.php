<?php

namespace App\Http\Controllers;

use App\Models\Territorio;
use Illuminate\Http\Request;

class TerritorioController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Territorio::with(['pais', 'parent']);

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

        return response()->json($query->orderBy('nombre')->get(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'pais_id' => 'required|exists:paises,id',
            'parent_id' => 'nullable|exists:territorios,id',
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|string|max:100',
            'activo' => 'boolean',
        ]);

        $territorio = Territorio::create([
            'pais_id' => $request->pais_id,
            'parent_id' => $request->parent_id,
            'nombre' => $request->nombre,
            'tipo' => $request->tipo,
            'activo' => $request->input('activo', true),
        ]);

        return response()->json([
            'message' => 'Territorio creado con éxito',
            'data' => $territorio->load(['pais', 'parent']),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $territorio = Territorio::with(['pais', 'parent', 'hijos'])->findOrFail($id);
        return response()->json($territorio, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $territorio = Territorio::findOrFail($id);

        $request->validate([
            'pais_id' => 'sometimes|required|exists:paises,id',
            'parent_id' => 'nullable|exists:territorios,id',
            'nombre' => 'sometimes|required|string|max:255',
            'tipo' => 'sometimes|required|string|max:100',
            'activo' => 'boolean',
        ]);

        $territorio->update($request->only(['pais_id', 'parent_id', 'nombre', 'tipo', 'activo']));

        return response()->json([
            'message' => 'Territorio actualizado con éxito',
            'data' => $territorio->load(['pais', 'parent']),
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $territorio = Territorio::findOrFail($id);

        if ($territorio->hijos()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar el territorio porque tiene subterritorios asociados.',
            ], 400);
        }

        if ($territorio->direcciones()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar el territorio porque tiene direcciones asociadas.',
            ], 400);
        }

        $territorio->delete();

        return response()->json([
            'message' => 'Territorio eliminado con éxito',
        ], 200);
    }
}
