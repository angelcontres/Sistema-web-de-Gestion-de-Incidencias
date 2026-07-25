<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserActivatedNotification extends Notification
{
    use Queueable;

    public $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5500');
        $url = rtrim($frontendUrl, '/').'/#/login';

        return (new MailMessage)
            ->subject('Cuenta Activada Exitosamente')
            ->greeting('¡Bienvenido '.$this->user->name.'!')
            ->line('Tu cuenta en GeoIncidencias ha sido activada con éxito.')
            ->line('Ahora puedes iniciar sesión en la plataforma con tu correo electrónico y la contraseña que has definido.')
            ->action('Ir a GeoIncidencias', $url)
            ->line('¡Gracias por unirte a nosotros!');
    }
}
