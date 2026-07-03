<?php

namespace App\Http\Controllers;

use App\Http\Requests\PrioridadRequest;
use App\Models\Prioridad;
use Illuminate\Http\JsonResponse;

class PrioridadController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        // Se muestran todas las prioridades
        $prioridades = Prioridad::orderBy('id')->get();

        return response()->json($prioridades, 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(PrioridadRequest $request): JsonResponse
    {
        $data = $request->only(['nombre', 'color_hex']);
        if (auth()->check()) {
            $data['created_by'] = auth()->id();
        }

        $prioridad = Prioridad::create($data);

        return response()->json([
            'message' => 'Prioridad creada con éxito',
            'data' => $prioridad,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id): JsonResponse
    {
        $prioridad = Prioridad::findOrFail($id);

        return response()->json($prioridad, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(PrioridadRequest $request, $id): JsonResponse
    {
        $prioridad = Prioridad::findOrFail($id);

        $data = $request->only(['nombre', 'color_hex']);
        if (auth()->check()) {
            $data['updated_by'] = auth()->id();
        }

        $prioridad->update($data);

        return response()->json([
            'message' => 'Prioridad actualizada con éxito',
            'data' => $prioridad,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id): JsonResponse
    {
        $prioridad = Prioridad::findOrFail($id);

        if (auth()->check()) {
            $prioridad->deleted_by = auth()->id();
            $prioridad->save();
        }

        $prioridad->delete();

        return response()->json([
            'message' => 'Prioridad eliminada con éxito',
        ], 200);
    }
}
