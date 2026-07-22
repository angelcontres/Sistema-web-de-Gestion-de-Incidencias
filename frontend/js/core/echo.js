import Echo from 'https://esm.sh/laravel-echo@^1.16.0';
import Pusher from 'https://esm.sh/pusher-js@^8.4.0';

window.Pusher = Pusher;

export function initEcho() {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  const isProduction = window.location.protocol === 'https:';

  return new Echo({
    broadcaster: 'reverb',
    key: 'my-app-key', // Asegúrate de que coincida con REVERB_APP_KEY de tu .env
    wsHost: window.location.hostname, // Usa el dominio actual automáticamente

    wsPort: isProduction ? 80 : 8080,
    wssPort: isProduction ? 443 : 8080,

    // Activa el cifrado de WebSockets solo si la página cargó por HTTPS
    forceTLS: isProduction,
    enabledTransports: ['ws', 'wss'],

    authEndpoint: '/api/broadcasting/auth',

    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
}
