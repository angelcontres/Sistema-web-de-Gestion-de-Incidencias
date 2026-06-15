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
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
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
        $user = $request->user();

        return response()->json([
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                // TODO - Agregar los campos de menu y permisos que correspondan al usuario autenticado
            ],
        ], 200);
    }
}
