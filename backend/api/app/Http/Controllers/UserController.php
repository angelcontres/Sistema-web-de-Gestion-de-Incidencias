<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\User;
use App\Models\UserInvitation;
use App\Notifications\UserInvitationNotification;
use App\Services\Contracts\RoleServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class UserController extends Controller
{
    protected RoleServiceInterface $roleService;

    public function __construct(RoleServiceInterface $roleService)
    {
        $this->roleService = $roleService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $users = User::with('roles')->paginate($perPage);

        return response()->json($users, 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request)
    {
        $datosValidados = $request->validated();

        $password = $datosValidados['password'] ?? Str::random(16);

        $user = User::create([
            'name' => $datosValidados['name'],
            'username' => $datosValidados['username'],
            'email' => $datosValidados['email'],
            'password' => Hash::make($password),
            'activo' => $datosValidados['activo'] ?? true,
            'institucion_id' => $datosValidados['institucion_id'] ?? null,
        ]);

        if (! empty($datosValidados['roles'])) {
            $this->roleService->syncRolesToUser($user, $datosValidados['roles']);
        }

        if (isset($datosValidados['territorios'])) {
            $user->territorios()->sync($datosValidados['territorios']);
        }

        if (empty($datosValidados['password'])) {
            $token = Str::random(60);

            UserInvitation::where('email', $user->email)->delete();

            $invitation = UserInvitation::create([
                'email' => $user->email,
                'token' => $token,
                'expires_at' => now()->addHours(24),
            ]);

            Notification::route('mail', $invitation->email)
                ->notify(new UserInvitationNotification($invitation));
        }

        return response()->json([
            'message' => empty($datosValidados['password']) 
                ? 'Usuario creado y se ha enviado la invitación exitosamente' 
                : 'Usuario creado con éxito',
            'data' => $user->load('roles'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $user = User::with(['roles', 'territorios'])->findOrFail($id);

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
            'institucion_id' => array_key_exists('institucion_id', $datosValidados) 
                ? $datosValidados['institucion_id'] 
                : $user->institucion_id,
        ];

        // Only update password if a new one is provided
        if (! empty($datosValidados['password'])) {
            $updateData['password'] = $datosValidados['password'];
        }

        $user->update($updateData);

        // Sync roles (many-to-many relationship)
        $this->roleService->syncRolesToUser($user, $datosValidados['roles'] ?? []);

        // Sync territories (many-to-many relationship)
        $user->territorios()->sync($datosValidados['territorios'] ?? []);

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

        \DB::transaction(function () use ($user) {
            // Detach roles to avoid foreign key constraint violations
            $user->roles()->detach();

            // Delete tokens to avoid orphan rows in personal_access_tokens
            $user->tokens()->delete();

            $user->delete();
        });

        return response()->json([
            'message' => 'Usuario eliminado con éxito',
        ], 200);
    }
}
