<?php

namespace App\Http\Controllers;

use App\Http\Requests\InstitucionesRequest;
use App\Models\Institucion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstitucionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Institucion::query();

        if ($request->has('search') && ! empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where('nombre', 'like', "%{$search}%")
                ->orWhere('siglas', 'like', "%{$search}%");
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
    public function store(InstitucionesRequest $request): JsonResponse
    {
        $data = $request->only(['nombre', 'siglas', 'activo']);
        if (auth()->check()) {
            $data['created_by'] = auth()->id();
        }

        $institucion = Institucion::create($data);

        return response()->json([
            'message' => 'Institución creada con éxito',
            'data' => $institucion,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id): JsonResponse
    {
        $institucion = Institucion::findOrFail($id);

        return response()->json($institucion, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(InstitucionesRequest $request, $id): JsonResponse
    {
        $institucion = Institucion::findOrFail($id);

        $data = $request->only(['nombre', 'siglas', 'activo']);
        if (auth()->check()) {
            $data['updated_by'] = auth()->id();
        }

        $institucion->update($data);

        return response()->json([
            'message' => 'Institución actualizada con éxito',
            'data' => $institucion,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id): JsonResponse
    {
        /** @var Institucion $institucion */
        $institucion = Institucion::findOrFail($id);

        if (auth()->check()) {
            $institucion->deleted_by = auth()->id();
            $institucion->save();
        }

        $institucion->delete();

        return response()->json([
            'message' => 'Institución eliminada con éxito',
        ], 200);
    }
}
