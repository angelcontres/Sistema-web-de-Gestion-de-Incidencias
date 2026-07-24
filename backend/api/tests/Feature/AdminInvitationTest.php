<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Models\UserInvitation;
use App\Notifications\UserActivatedNotification;
use App\Notifications\UserInvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

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

        $response = $this->actingAs($admin)->postJson('/api/v1/users', [
            'name' => 'Test Supervisor',
            'username' => 'test_supervisor',
            'email' => 'operador@example.com',
            'roles' => [$targetRole->id],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('user_invitations', [
            'email' => 'operador@example.com',
        ]);
        $this->assertDatabaseHas('users', [
            'email' => 'operador@example.com',
        ]);

        Notification::assertSentOnDemand(UserInvitationNotification::class);
    }

    public function test_citizen_cannot_invite_user()
    {
        $citizenRole = Role::where('nombre', 'Ciudadano')->first();
        $citizen = User::factory()->create();
        $citizen->roles()->attach($citizenRole->id);

        $targetRole = Role::where('nombre', 'Supervisor')->first();

        $response = $this->actingAs($citizen)->postJson('/api/v1/users', [
            'name' => 'Test Supervisor 2',
            'username' => 'test_supervisor_2',
            'email' => 'operador2@example.com',
            'roles' => [$targetRole->id],
        ]);

        // Debe ser 403 Forbidden por CheckResourcePermission
        $response->assertStatus(403);
    }

    public function test_invited_user_can_activate_account()
    {
        Notification::fake();

        $targetRole = Role::where('nombre', 'Supervisor')->first();

        User::factory()->create([
            'email' => 'newuser@example.com',
            'name' => 'New User',
            'email_verified_at' => null,
        ]);

        UserInvitation::create([
            'email' => 'newuser@example.com',
            'token' => 'test-token-123',
            'expires_at' => now()->addHours(24),
        ]);

        $response = $this->postJson('/api/v1/auth/activate', [
            'token' => 'test-token-123',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(200);
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
