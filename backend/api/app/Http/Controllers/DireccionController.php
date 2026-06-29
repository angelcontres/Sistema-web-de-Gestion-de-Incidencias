<?php

namespace App\Http\Controllers;

use App\Models\Direccion;
use Illuminate\Http\Request;

class DireccionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Direccion::with(['territorio.pais']);

        if ($request->has('territorio_id')) {
            $query->where('territorio_id', $request->input('territorio_id'));
        }

        return response()->json($query->orderBy('id', 'desc')->get(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'territorio_id' => 'required|exists:territorios,id',
            'detalle' => 'required|string|max:255',
            'referencia' => 'nullable|string|max:255',
            'codigo_postal' => 'nullable|string|max:20',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'activo' => 'boolean',
        ]);

        $direccion = Direccion::create([
            'territorio_id' => $request->territorio_id,
            'detalle' => $request->detalle,
            'referencia' => $request->referencia,
            'codigo_postal' => $request->codigo_postal,
            'latitud' => $request->latitud,
            'longitud' => $request->longitud,
            'activo' => $request->input('activo', true),
        ]);

        return response()->json([
            'message' => 'Dirección creada con éxito',
            'data' => $direccion->load(['territorio.pais']),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $direccion = Direccion::with(['territorio.pais'])->findOrFail($id);
        return response()->json($direccion, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $direccion = Direccion::findOrFail($id);

        $request->validate([
            'territorio_id' => 'sometimes|required|exists:territorios,id',
            'detalle' => 'sometimes|required|string|max:255',
            'referencia' => 'nullable|string|max:255',
            'codigo_postal' => 'nullable|string|max:20',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'activo' => 'boolean',
        ]);

        $direccion->update($request->only(['territorio_id', 'detalle', 'referencia', 'codigo_postal', 'latitud', 'longitud', 'activo']));

        return response()->json([
            'message' => 'Dirección actualizada con éxito',
            'data' => $direccion->load(['territorio.pais']),
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $direccion = Direccion::findOrFail($id);
        $direccion->delete();

        return response()->json([
            'message' => 'Dirección eliminada con éxito',
        ], 200);
    }
}
