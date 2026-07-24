<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\UserInvitation;
use App\Http\Requests\ActivateAccountRequest;
use App\Notifications\UserActivatedNotification;
use Illuminate\Support\Facades\Notification;

class AuthController extends Controller
{
    //
    public function login(LoginRequest $request): JsonResponse
    {
        $login = $request->input('login');
        // 1. Buscar al usuario por email o por username
        $user = User::where('email', $login)
            ->orWhere('username', $login)
            ->first();

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

    public function register(\App\Http\Requests\RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $email = $validated['email'] ?? null;
        $username = $validated['username'] ?? null;

        if ($email && !$username) {
            $username = strtolower(explode('@', $email)[0]) . '_' . rand(100, 999);
        } elseif ($username && !$email) {
            $email = $username . '@ciudadano.local';
        }

        $user = User::create([
            'email' => $email,
            'username' => $username,
            'password' => Hash::make($validated['password']),
            'activo' => true,
        ]);
        $user->email_verified_at = now();
        $user->save();

        // Asignar rol Ciudadano
        $role = \App\Models\Role::where('nombre', 'Ciudadano')->first();
        if ($role) {
            $user->roles()->attach($role->id);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'username' => $user->username,
            ],
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    public function activate(ActivateAccountRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $invitation = UserInvitation::where('token', $validated['token'])->first();

        if (!$invitation) {
            return response()->json(['message' => 'El enlace de activación es inválido o ya fue usado.'], 422);
        }

        if (now()->greaterThan($invitation->expires_at)) {
            return response()->json(['message' => 'El enlace de activación ha expirado.'], 422);
        }

        $user = User::where('email', $invitation->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado.'], 404);
        }

        $user->password = Hash::make($validated['password']);
        $user->email_verified_at = now();
        $user->save();
        
        $invitation->delete();

        Notification::route('mail', $user->email)->notify(new UserActivatedNotification($user));

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Cuenta activada exitosamente.',
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
        /** @var User $user */
        $user = clone $request->user();
        $user->load('roles.permisos');

        $permisosList = collect();
        foreach ($user->roles as $role) {
            foreach ($role->permisos as $permiso) {
                // Agregamos el formato estandarizado (ej: 'READ_USUARIOS')
                $permisosList->push(strtoupper($permiso->accion.'_'.$permiso->recurso));
            }
        }
        $permisosList = $permisosList->unique()->values();

        $isAdminFlag = clone $user;
        $isAdmin = $isAdminFlag->roles()->where('nombre', 'Admin')->exists();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'is_admin' => $isAdmin,
                'permisos' => $permisosList,
                'pais_id' => $user->pais_id,
                'institucion_id' => $user->institucion_id,
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
