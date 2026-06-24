<?php

namespace App\Http\Controllers;

use App\Models\OpcionMenu;
use Illuminate\Http\Request;

class OpcionMenuController extends Controller
{
    /**
     * GET
     * Muestra la lista de registros de OpcionMenu
     */
    public function index(Request $request)
    {
        $query = OpcionMenu::query();

        // If tree=true is passed, retrieve hierarchical structure (root-level options only, with children loaded)
        if ($request->boolean('tree')) {
            $opciones = $query->with('hijos')->whereNull('padre_id')->get();
        } else {
            // Flat list, loaded with parent info
            $opciones = $query->with('padre')->get();
        }

        return response()->json([
            'status' => 'success',
            'data' => $opciones,
        ]);
    }

    /**
     * POST
     * Permite insertar un registro en OpcionMenu
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:50',
            'icono' => 'nullable|string|max:50',
            'ruta' => 'required|string|max:255',
            'padre_id' => 'nullable|exists:opciones_menu,id',
        ]);

        $opcion = OpcionMenu::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Opción de menú creada correctamente',
            'data' => $opcion,
        ], 201);
    }

    /**
     * GET
     * Muestra un registro especifico de OpcionMenu
     */
    public function show(string $id)
    {
        $opcion = OpcionMenu::with(['padre', 'hijos'])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $opcion,
        ]);
    }

    /**
     * PUT
     * Permite actualizar un registro de OpcionMenu
     */
    public function update(Request $request, string $id)
    {
        $opcion = OpcionMenu::findOrFail($id);

        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:50',
            'icono' => 'nullable|string|max:50',
            'ruta' => 'sometimes|required|string|max:255',
            'padre_id' => 'nullable|exists:opciones_menu,id',
        ]);

        // Prevent circular references (self-parent or making a descendant the parent)
        if (array_key_exists('padre_id', $validated) && $validated['padre_id'] !== null) {
            $padreId = (int) $validated['padre_id'];

            if ($padreId === (int) $opcion->id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Una opción de menú no puede ser su propio padre.',
                ], 422);
            }

            $cursor = OpcionMenu::find($padreId);
            while ($cursor) {
                if ((int) $cursor->id === (int) $opcion->id) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'No se puede asignar una opción descendiente como padre (referencia circular).',
                    ], 422);
                }
                $cursor = $cursor->padre_id ? OpcionMenu::find($cursor->padre_id) : null;
            }
        }

        $opcion->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Opción de menú actualizada correctamente',
            'data' => $opcion,
        ]);
    }

    /**
     * DELETE
     * Permite eliminar un registro de OpcionMenu
     */
    public function destroy(string $id)
    {
        $opcion = OpcionMenu::findOrFail($id);

        // Before soft deleting, set children's padre_id to null so they are not orphaned
        $opcion->hijos()->update(['padre_id' => null]);

        $opcion->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Opción de menú eliminada correctamente',
        ]);
    }
}
