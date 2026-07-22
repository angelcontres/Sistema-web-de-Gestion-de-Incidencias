<?php

namespace App\Http\Controllers;

use App\Http\Requests\InviteUserRequest;
use App\Models\UserInvitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class AdminUserController extends Controller
{
    public function invite(InviteUserRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $token = Str::random(60);

        // Delete any existing invitation for this email
        UserInvitation::where('email', $validated['email'])->delete();

        $invitation = UserInvitation::create([
            'email' => $validated['email'],
            'token' => $token,
            'name' => $validated['name'],
            'role_id' => $validated['role_id'],
            'institution_id' => $validated['institution_id'] ?? null,
            'expires_at' => now()->addHours(24),
        ]);

        // Envío de correo
        \Illuminate\Support\Facades\Notification::route('mail', $invitation->email)
            ->notify(new \App\Notifications\UserInvitationNotification($invitation));

        return response()->json([
            'message' => 'Invitación enviada exitosamente.',
            'invitation' => $invitation
        ], 201);
    }
}
