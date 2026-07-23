export const environment = {
  production: false,
  // Si estamos en el puerto local 3006 (script iniciar.sh), apunta a Laravel en 8001
  // De lo contrario (Docker Nginx), asume que la API y el Frontend comparten puerto y usa relativa /api
  apiBaseUrl: window.location.port === '3006'
    ? `${window.location.protocol}//${window.location.hostname}:8001/api`
    : '/api'
};
