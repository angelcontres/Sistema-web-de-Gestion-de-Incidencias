<?php

namespace App\Http\Controllers;

use App\Models\Permiso;
use App\Models\OpcionMenu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PermisoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(Permiso::with('opcionMenu')->get(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $opcionMenu = OpcionMenu::findOrFail($request->opcion_menu_id);

        $permiso = Permiso::create([
            'nombre' => $request->nombre,
            'accion' => $request->accion,
            'recurso' => $opcionMenu->nombre,
            'opcion_menu_id' => $request->opcion_menu_id,
            'created_by' => Auth::id() ?? 1,
        ]);

        return response()->json([
            'message' => 'Permiso creado con éxito',
            'data' => $permiso,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $permiso = Permiso::findOrFail($id);

        return response()->json($permiso, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $permiso = Permiso::findOrFail($id);
        
        $recurso = $permiso->recurso;
        if ($request->has('opcion_menu_id') && $request->opcion_menu_id != $permiso->opcion_menu_id) {
            $opcionMenu = OpcionMenu::findOrFail($request->opcion_menu_id);
            $recurso = $opcionMenu->nombre;
        }

        $permiso->update([
            'nombre' => $request->nombre ?? $permiso->nombre,
            'accion' => $request->accion ?? $permiso->accion,
            'recurso' => $recurso,
            'opcion_menu_id' => $request->opcion_menu_id ?? $permiso->opcion_menu_id,
            'updated_by' => Auth::id() ?? 1,
        ]);

        return response()->json([
            'message' => 'Permiso actualizado con éxito',
            'data' => $permiso,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $permiso = Permiso::findOrFail($id);

        $permiso->update([
            'deleted_by' => Auth::id() ?? 1,
        ]);
        $permiso->delete();

        return response()->json([
            'message' => 'Permiso eliminado con éxito',
        ], 200);
    }
}
