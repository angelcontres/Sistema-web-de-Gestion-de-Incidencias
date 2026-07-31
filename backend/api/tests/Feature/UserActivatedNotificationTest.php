<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\UserActivatedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class UserActivatedNotificationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @group HU-06
     */
    public function test_user_activated_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create(['name' => 'John Doe', 'email' => 'john@example.com']);

        $user->notify(new UserActivatedNotification($user));

        Notification::assertSentTo(
            $user,
            UserActivatedNotification::class,
            function ($notification, $channels) use ($user) {
                // Assert it sends via mail
                $this->assertContains('mail', $channels);

                // Assert mail message content
                $mailData = $notification->toMail($user);
                $this->assertInstanceOf(MailMessage::class, $mailData);
                $this->assertEquals('Cuenta Activada Exitosamente', $mailData->subject);
                $this->assertEquals('¡Bienvenido John Doe!', $mailData->greeting);
                $this->assertStringContainsString('Tu cuenta en GeoIncidencias ha sido activada con éxito.', $mailData->introLines[0]);
                $this->assertStringContainsString('Ahora puedes iniciar sesión', $mailData->introLines[1]);
                $this->assertEquals('Ir a GeoIncidencias', $mailData->actionText);

                return true;
            }
        );
    }
}
