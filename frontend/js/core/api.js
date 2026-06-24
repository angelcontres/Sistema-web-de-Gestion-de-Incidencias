/**
 * API Helper for fetch requests
 */

// Dynamically determine API base URL (uses Laravel port 8000 if running on a custom dev port like 5500 or 3000)
export const API_BASE_URL =
  window.location.port && window.location.port !== '80'
    ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
    : '/api/v1';

/**
 * Perform an authenticated HTTP request to the backend API.
 * @param {string} endpoint - API path (e.g., '/login' or '/me')
 * @param {RequestInit} [options={}] - Standard fetch options
 * @returns {Promise<any>} Response JSON data
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Set up default headers
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  // Add Sanctum Bearer token if it exists in localStorage
  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  // If response is 401 Unauthorized, automatically clear token and redirect to login
  if (response.status === 401 && !endpoint.includes('/login')) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.hash = '#/login';
    throw new Error('Sesión expirada o no autorizada.');
  }

  // Parse JSON response
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || `Error del servidor (HTTP ${response.status})`);
  }

  return data;
}
