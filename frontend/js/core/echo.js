// Importamos Echo y Pusher (asegúrate de haber ejecutado npm i @laravel/echo pusher-js
// o imfórmalos vía CDN en tu index.html si no usas un bundler como Vite)
import Echo from 'https://esm.sh/laravel-echo@^1.16.0';
import Pusher from 'https://esm.sh/pusher-js@^8.4.0';


window.Pusher = Pusher;

export function initEcho() {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  return new Echo({
    broadcaster: 'reverb',
    key: 'my-app-key', // El mismo EVERB_APP_KEY de tu .env
    wsHost: window.location.hostname,
    wsPort: 8080,
    wssPort: 8080,
    forceTLS: false, // Ponlo en true cuando pases a HTTPS en producción
    enabledTransports: ['ws', 'wss'],
    
    // VITAL PARA SANCTUM: Enviamos tu token para poder entrar al canal privado
    authEndpoint: 'http://127.0.0.1:8000/api/broadcasting/auth',
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
}