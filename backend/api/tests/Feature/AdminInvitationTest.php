<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\UserInvitation;
use Illuminate\Support\Facades\Notification;
use App\Notifications\UserInvitationNotification;
use App\Notifications\UserActivatedNotification;

class AdminInvitationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_admin_can_invite_user_and_send_notification()
    {
        Notification::fake();

        $adminRole = Role::where('nombre', 'Admin')->first();
        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole->id);

        $targetRole = Role::where('nombre', 'Supervisor')->first();

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/users/invite', [
            'email' => 'operador@example.com',
            'name' => 'Test Supervisor',
            'role_id' => $targetRole->id,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('user_invitations', [
            'email' => 'operador@example.com',
            'role_id' => $targetRole->id,
        ]);

        Notification::assertSentOnDemand(UserInvitationNotification::class);
    }

    public function test_citizen_cannot_invite_user()
    {
        $citizenRole = Role::where('nombre', 'Ciudadano')->first();
        $citizen = User::factory()->create();
        $citizen->roles()->attach($citizenRole->id);

        $targetRole = Role::where('nombre', 'Supervisor')->first();

        $response = $this->actingAs($citizen)->postJson('/api/v1/admin/users/invite', [
            'email' => 'operador2@example.com',
            'name' => 'Test Supervisor 2',
            'role_id' => $targetRole->id,
        ]);

        // Debe ser 403 Forbidden por CheckResourcePermission
        $response->assertStatus(403);
    }

    public function test_invited_user_can_activate_account()
    {
        Notification::fake();

        $targetRole = Role::where('nombre', 'Supervisor')->first();

        UserInvitation::create([
            'email' => 'newuser@example.com',
            'name' => 'New User',
            'role_id' => $targetRole->id,
            'token' => 'test-token-123',
            'expires_at' => now()->addHours(24),
        ]);

        $response = $this->postJson('/api/v1/auth/activate', [
            'token' => 'test-token-123',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure(['access_token']);

        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
        ]);
        $this->assertDatabaseMissing('user_invitations', [
            'email' => 'newuser@example.com',
        ]);

        Notification::assertSentOnDemand(UserActivatedNotification::class);
    }
}
