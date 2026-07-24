<?php

namespace App\Http\Controllers;

use App\Models\OpcionMenu;
use App\Models\Permiso;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PermisoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Permiso::with('opcionMenu');

        if ($request->query('all') === 'true' || $request->query('all') === '1') {
            return response()->json($query->get(), 200);
        }

        $perPage = $request->input('per_page', 15);

        return response()->json($query->paginate($perPage), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $opcionMenu = $request->opcion_menu_id ? OpcionMenu::find($request->opcion_menu_id) : null;

        // Derivar recurso a partir de la ruta (ej. "#/opciones-menu" -> "opciones_menu") si no se pasa explícitamente
        $recursoStr = $request->recurso;
        if (empty($recursoStr) && $opcionMenu) {
            $recursoStr = str_replace(['#/', '/'], '', $opcionMenu->ruta);
            $recursoStr = str_replace('-', '_', $recursoStr);
        }

        $permiso = Permiso::create([
            'nombre' => $request->nombre,
            'accion' => $request->accion,
            'recurso' => $recursoStr,
            'opcion_menu_id' => $request->opcion_menu_id,
            'created_by' => Auth::id() ?? 1,
        ]);

        $adminRole = Role::where('nombre', 'Admin')->first();
        if ($adminRole) {
            $adminRole->permisos()->attach($permiso->id);
        }

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

        $recurso = $request->recurso ?? $permiso->recurso;
        if (empty($request->recurso) && $request->has('opcion_menu_id') && $request->opcion_menu_id != $permiso->opcion_menu_id) {
            $opcionMenu = OpcionMenu::find($request->opcion_menu_id);
            if ($opcionMenu) {
                $recursoStr = str_replace(['#/', '/'], '', $opcionMenu->ruta);
                $recurso = str_replace('-', '_', $recursoStr);
            }
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
