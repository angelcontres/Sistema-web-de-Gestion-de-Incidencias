<?php

namespace App\Notifications;

use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $invitation;

    public function __construct(UserInvitation $invitation)
    {
        $this->invitation = $invitation;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5500');
        $url = rtrim($frontendUrl, '/').'/#/activate?token='.$this->invitation->token;

        $user = User::where('email', $this->invitation->email)->first();
        $name = $user ? $user->name : 'Usuario';

        return (new MailMessage)
            ->subject('Invitación a GeoIncidencias')
            ->greeting('¡Hola '.$name.'!')
            ->line('Has sido invitado para unirte al sistema GeoIncidencias con rol administrativo.')
            ->line('Por favor, activa tu cuenta y configura tu contraseña haciendo clic en el siguiente botón:')
            ->action('Activar mi cuenta', $url)
            ->line('Este enlace expirará en 24 horas.')
            ->line('Si no esperabas esta invitación, puedes ignorar este correo.');
    }
}
