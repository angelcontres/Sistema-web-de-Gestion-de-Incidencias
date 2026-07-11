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

        // 4. Retornar respuesta
        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
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
                $permisosList->push($permiso->nombre);
            }
        }
        $permisosList = $permisosList->unique()->values();

        $isAdminFlag = clone $user;
        $isAdmin = $isAdminFlag->roles()->where('nombre', 'Admin')->exists();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_admin' => $isAdmin,
                'permisos' => $permisosList,
                'pais_id' => $user->pais_id,
                'max_files' => (int) env('MAX_FILE_UPLOAD_LIMIT', 5),
                'roles' => $user->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'nombre' => $role->nombre,
                    ];
                })->toArray(),
            ],
        ], 200);
    }

    /**
     * Refresh the user's Sanctum API token.
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoke the token that was used to authenticate the current request
        $user->currentAccessToken()->delete();

        // Generate a new token
        $newToken = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $newToken,
            'token_type' => 'Bearer',
        ], 200);
    }
}
