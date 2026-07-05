<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoleRequest;
use App\Models\Role;
use App\Services\Contracts\PermissionServiceInterface;
use App\Services\Contracts\RoleServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleController extends Controller
{
    protected RoleServiceInterface $roleService;

    protected PermissionServiceInterface $permissionService;

    public function __construct(RoleServiceInterface $roleService, PermissionServiceInterface $permissionService)
    {
        $this->roleService = $roleService;
        $this->permissionService = $permissionService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->roleService->getAllRoles(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $role = Role::create([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'padre_id' => $request->padre_id,
            'created_by' => Auth::id() ?? 1,
        ]);

        return response()->json([
            'message' => 'Rol creado con éxito',
            'data' => $role,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $role = $this->roleService->getRoleById($id);

        if (! $role) {
            return response()->json(['message' => 'Rol no encontrado'], 404);
        }

        return response()->json($role, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $role->update([
            'nombre' => $request->nombre ?? $role->nombre,
            'descripcion' => $request->descripcion ?? $role->descripcion,
            'padre_id' => $request->padre_id ?? $role->padre_id,
        ]);

        return response()->json([
            'message' => 'Rol actualizado con éxito',
            'data' => $role,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $role = Role::findOrFail($id);
        $role->delete();

        return response()->json([
            'message' => 'Rol eliminado con éxito',
        ], 200);
    }

    /**
     * Assign permissions to the role.
     */
    public function assignPermissions(RoleRequest $request, $id)
    {
        $role = Role::findOrFail($id);

        $this->permissionService->syncPermissionsToRole($role, $request->permisos ?? []);

        return response()->json([
            'message' => 'Permisos asignados con éxito al rol.',
            'data' => $role->load('permisos'),
        ], 200);
    }
}
