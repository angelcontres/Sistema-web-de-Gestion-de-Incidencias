<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\User;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class UserController extends Controller implements HasMiddleware
{
    /**
     * Get the middleware that should be assigned to the controller.
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:Ver Usuario', only: ['index', 'show']),
            new Middleware('permission:Crear Usuario', only: ['store']),
            new Middleware('permission:Actualizar Usuario', only: ['update']),
            new Middleware('permission:Eliminar Usuario', only: ['destroy']),
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = User::with('roles')->get();

        return response()->json($users, 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request)
    {
        $datosValidados = $request->validated();

        $user = User::create([
            'name' => $datosValidados['name'],
            'username' => $datosValidados['username'],
            'email' => $datosValidados['email'],
            'password' => $datosValidados['password'],
            'activo' => $datosValidados['activo'] ?? true,
        ]);

        if (! empty($datosValidados['roles'])) {
            $user->roles()->attach($datosValidados['roles']);
        }

        return response()->json([
            'message' => 'Usuario creado con éxito',
            'data' => $user->load('roles'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $user = User::with('roles')->findOrFail($id);

        return response()->json($user, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UserRequest $request, $id)
    {
        $user = User::findOrFail($id);
        $datosValidados = $request->validated();

        // Prepare fields to update
        $updateData = [
            'name' => $datosValidados['name'] ?? $user->name,
            'username' => $datosValidados['username'] ?? $user->username,
            'email' => $datosValidados['email'] ?? $user->email,
            'activo' => $datosValidados['activo'] ?? $user->activo,
        ];

        // Only update password if a new one is provided
        if (! empty($datosValidados['password'])) {
            $updateData['password'] = $datosValidados['password'];
        }

        $user->update($updateData);

        // Sync roles (many-to-many relationship)
        $user->roles()->sync($datosValidados['roles'] ?? []);

        return response()->json([
            'message' => 'Usuario actualizado con éxito',
            'data' => $user->load('roles'),
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => 'Usuario eliminado con éxito',
        ], 200);
    }
}
