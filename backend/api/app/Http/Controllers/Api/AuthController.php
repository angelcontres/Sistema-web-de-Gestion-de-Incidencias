<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;

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
                'message' => 'Las credenciales no coinciden con nuestros registros.'
            ], 401);
        }

        // 3. Crear el token de acceso (Asegúrate de que el modelo User tenga HasApiTokens)
        $token = $user->createToken('auth_token')->plainTextToken;

        // 4. Retornar respuesta
        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ]
        ], 200);
    }
}
