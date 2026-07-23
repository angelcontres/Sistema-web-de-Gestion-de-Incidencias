let apiBaseUrl = '/api';

if (window.location.port === '3006') {
  apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:8001/api`; // Cuando usas iniciar.sh
} else if (window.location.port === '5500' || window.location.port === '3000') {
  apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:8000/api`; // Cuando usas php artisan serve manualmente
}

export const environment = {
  production: false,
  apiBaseUrl
};
