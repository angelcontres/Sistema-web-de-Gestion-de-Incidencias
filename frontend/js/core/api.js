/**
 * API Helper for fetch requests
 */

import { environment } from '../../environment/environment.js';

// Dynamically determine API base URL (uses Laravel port 8000 if running on a custom dev port like 5500 or 3000)
export const API_BASE_URL = `${environment.apiBaseUrl}/v1`;

/**
 * Perform an authenticated HTTP request to the backend API.
 * @param {string} endpoint - API path (e.g., '/login' or '/me')
 * @param {RequestInit} [options={}] - Standard fetch options
 * @returns {Promise<any>} Response JSON data
 */
function buildHeaders(options) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function handleUnauthorized(response, endpoint) {
  if (response.status === 401 && !endpoint.includes('/login')) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    if (window.location.hash !== '#/login') {
      window.location.hash = '#/login';
    }
    throw new Error('Sesión expirada o no autorizada.');
  }
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch (e) {
    console.log('Error al obtener respuesta de json parseado', e);
  }
}

function handleForbidden(response, data) {
  if (response.status === 403) {
    const msg = data.message || 'No tienes permisos para realizar esta acción.';
    window.dispatchEvent(new CustomEvent('api-forbidden', { detail: { message: msg } }));
    throw new Error(msg);
  }
}

function handleErrorResponse(response, data) {
  if (!response.ok) {
    let errMsg = data.message || `Error del servidor (HTTP ${response.status})`;

    if (response.status === 422 && data.errors) {
      const firstErrorKey = Object.keys(data.errors)[0];
      errMsg = data.errors[firstErrorKey][0];
    }

    if (typeof errMsg === 'string' && errMsg.includes('SQLSTATE')) {
      if (
        errMsg.includes('23505') ||
        errMsg.includes('unique constraint') ||
        errMsg.includes('Duplicate')
      ) {
        errMsg =
          'Error de integridad: Ya existe un registro con esa información única (ej. email duplicado).';
      } else {
        errMsg =
          'Ocurrió un error en el servidor al intentar procesar los datos (Operación abortada por seguridad).';
      }
    }

    throw new Error(errMsg);
  }
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = { ...options, headers: buildHeaders(options) };

  const response = await fetch(url, config);

  handleUnauthorized(response, endpoint);

  const data = await parseJsonResponse(response);

  handleForbidden(response, data);
  handleErrorResponse(response, data);

  return data;
}
