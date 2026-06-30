import { apiRequest } from '../../../core/api.js';

export const UbicacionesService = {
  // --- PAISES ---
  getPaises() {
    return apiRequest('/v1/paises');
  },
  getPaisById(id) {
    return apiRequest(`/v1/paises/${id}`);
  },
  createPais(payload) {
    return apiRequest('/v1/paises', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updatePais(id, payload) {
    return apiRequest(`/v1/paises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deletePais(id) {
    return apiRequest(`/v1/paises/${id}`, {
      method: 'DELETE',
    });
  },

  // --- TERRITORIOS ---
  getTerritorios(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.pais_id) queryParams.append('pais_id', params.pais_id);
    if (params.parent_id !== undefined) {
      queryParams.append('parent_id', params.parent_id === null ? '' : params.parent_id);
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest(`/v1/territorios${queryString}`);
  },
  getTerritorioById(id) {
    return apiRequest(`/v1/territorios/${id}`);
  },
  createTerritorio(payload) {
    return apiRequest('/v1/territorios', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateTerritorio(id, payload) {
    return apiRequest(`/v1/territorios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteTerritorio(id) {
    return apiRequest(`/v1/territorios/${id}`, {
      method: 'DELETE',
    });
  },

  // --- DIRECCIONES ---
  getDirecciones(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.territorio_id) queryParams.append('territorio_id', params.territorio_id);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest(`/v1/direcciones${queryString}`);
  },
  getDireccionById(id) {
    return apiRequest(`/v1/direcciones/${id}`);
  },
  createDireccion(payload) {
    return apiRequest('/v1/direcciones', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateDireccion(id, payload) {
    return apiRequest(`/v1/direcciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteDireccion(id) {
    return apiRequest(`/v1/direcciones/${id}`, {
      method: 'DELETE',
    });
  },
  reverseGeocode(lat, lng) {
    return apiRequest(`/v1/geocodificacion/reversa?lat=${lat}&lng=${lng}`);
  },
};
