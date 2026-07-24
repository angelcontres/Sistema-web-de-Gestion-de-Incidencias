import { environment } from '../../environment/environment.js';
import Echo from 'https://esm.sh/laravel-echo@^1.16.0';
import Pusher from 'https://esm.sh/pusher-js@^8.4.0';

window.Pusher = Pusher;

export function initEcho() {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  const isProduction = window.location.protocol === 'https:';
  const currentPort = window.location.port || (isProduction ? 443 : 80);
  const isDevPort = ['3006', '5500', '3000'].includes(window.location.port);

  return new Echo({
    broadcaster: 'reverb',
    key: 'my-app-key',
    wsHost: window.location.hostname,

    wsPort: isDevPort ? 8083 : currentPort,
    wssPort: isDevPort ? 8083 : currentPort,

    forceTLS: isProduction,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${environment.apiBaseUrl}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
}
