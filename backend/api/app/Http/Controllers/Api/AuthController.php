<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    //
    public function login(LoginRequest $request): JsonResponse
    {
        // 1. Buscar al usuario
        $user = User::where('email', $request->email)->first();

        // 2. Verificar credenciales
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Las credenciales no coinciden con nuestros registros.',
            ], 401);
        }

        // 3. Crear el token de acceso para el usuario autenticado
        $token = $user->createToken('auth_token')->plainTextToken;

        // 4. Obtener permisos del usuario
        $user->load('roles.permisos');
        $permisosList = collect();
        foreach ($user->roles as $role) {
            foreach ($role->permisos as $permiso) {
                $permisosList->push([
                    'accion' => $permiso->accion,
                    'recurso' => $permiso->recurso
                ]);
            }
        }
        $permisosList = $permisosList->unique(function ($item) {
            return $item['accion'].'-'.$item['recurso'];
        })->values();

        $isAdmin = clone $user;
        $isAdminFlag = $isAdmin->roles()->where('nombre', 'Admin')->exists();

        // 5. Retornar respuesta
        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_admin' => $isAdminFlag,
                'permisos' => $permisosList,
            ],
        ], 200);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente.',
        ], 200);
    }

    public function me(Request $request): JsonResponse
    {
        $user = clone $request->user();
        $user->load('roles.permisos');

        $permisosList = collect();
        foreach ($user->roles as $role) {
            foreach ($role->permisos as $permiso) {
                $permisosList->push([
                    'accion' => $permiso->accion,
                    'recurso' => $permiso->recurso
                ]);
            }
        }
        $permisosList = $permisosList->unique(function ($item) {
            return $item['accion'].'-'.$item['recurso'];
        })->values();

        $isAdminFlag = clone $user;
        $isAdmin = $isAdminFlag->roles()->where('nombre', 'Admin')->exists();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_admin' => $isAdmin,
                'permisos' => $permisosList,
            ],
        ], 200);
    }
}
