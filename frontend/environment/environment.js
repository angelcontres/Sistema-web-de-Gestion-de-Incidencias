export const environment = {
  production: false,
  apiBaseUrl: window.location.port && window.location.port !== '80'
    ? `${window.location.protocol}//${window.location.hostname}:8000/api`
    : '/api'
};
