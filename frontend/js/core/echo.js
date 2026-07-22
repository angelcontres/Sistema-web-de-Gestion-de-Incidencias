import Echo from 'https://esm.sh/laravel-echo@^1.16.0';
import Pusher from 'https://esm.sh/pusher-js@^8.4.0';

window.Pusher = Pusher;

export function initEcho() {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  const isProduction = window.location.protocol === 'https:';
  const currentPort = window.location.port || (isProduction ? 443 : 80);

  return new Echo({
    broadcaster: 'reverb',
    key: 'my-app-key',
    wsHost: window.location.hostname,

    wsPort: currentPort,
    wssPort: currentPort,

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
