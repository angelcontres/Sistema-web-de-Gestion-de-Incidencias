<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\UserInvitation;

class UserInvitationNotification extends Notification
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
        $url = rtrim($frontendUrl, '/') . '/#/activate?token=' . $this->invitation->token;

        $user = \App\Models\User::where('email', $this->invitation->email)->first();
        $name = $user ? $user->name : 'Usuario';

        return (new MailMessage)
                    ->subject('Invitación a GeoIncidencias')
                    ->greeting('¡Hola ' . $name . '!')
                    ->line('Has sido invitado para unirte al sistema GeoIncidencias con rol administrativo.')
                    ->line('Por favor, activa tu cuenta y configura tu contraseña haciendo clic en el siguiente botón:')
                    ->action('Activar mi cuenta', $url)
                    ->line('Este enlace expirará en 24 horas.')
                    ->line('Si no esperabas esta invitación, puedes ignorar este correo.');
    }
}
