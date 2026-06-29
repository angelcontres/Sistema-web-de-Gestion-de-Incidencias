<?php

namespace App\Http\Controllers;

use App\Models\Pais;
use Illuminate\Http\Request;

class PaisController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(Pais::orderBy('nombre')->get(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255|unique:paises,nombre',
            'codigo_iso' => 'required|string|max:10|unique:paises,codigo_iso',
            'activo' => 'boolean',
        ]);

        $pais = Pais::create([
            'nombre' => $request->nombre,
            'codigo_iso' => $request->codigo_iso,
            'activo' => $request->input('activo', true),
        ]);

        return response()->json([
            'message' => 'País creado con éxito',
            'data' => $pais,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $pais = Pais::findOrFail($id);
        return response()->json($pais, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $pais = Pais::findOrFail($id);

        $request->validate([
            'nombre' => 'sometimes|required|string|max:255|unique:paises,nombre,' . $id,
            'codigo_iso' => 'sometimes|required|string|max:10|unique:paises,codigo_iso,' . $id,
            'activo' => 'boolean',
        ]);

        $pais->update($request->only(['nombre', 'codigo_iso', 'activo']));

        return response()->json([
            'message' => 'País actualizado con éxito',
            'data' => $pais,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $pais = Pais::findOrFail($id);

        if ($pais->territorios()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar el país porque tiene territorios asociados.',
            ], 400);
        }

        $pais->delete();

        return response()->json([
            'message' => 'País eliminado con éxito',
        ], 200);
    }
}
