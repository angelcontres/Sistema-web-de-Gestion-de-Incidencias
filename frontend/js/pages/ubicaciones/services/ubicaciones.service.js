import { apiRequest } from '../../../core/api.js';

export const UbicacionesService = {
  // --- PAISES ---
  getPaises() {
    return apiRequest('/paises');
  },
  getPaisById(id) {
    return apiRequest(`/paises/${id}`);
  },
  createPais(payload) {
    return apiRequest('/paises', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updatePais(id, payload) {
    return apiRequest(`/paises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deletePais(id) {
    return apiRequest(`/paises/${id}`, {
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
    return apiRequest(`/territorios${queryString}`);
  },
  getTerritorioById(id) {
    return apiRequest(`/territorios/${id}`);
  },
  createTerritorio(payload) {
    return apiRequest('/territorios', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateTerritorio(id, payload) {
    return apiRequest(`/territorios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteTerritorio(id) {
    return apiRequest(`/territorios/${id}`, {
      method: 'DELETE',
    });
  },

  // --- DIRECCIONES ---
  getDirecciones(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.territorio_id) queryParams.append('territorio_id', params.territorio_id);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest(`/direcciones${queryString}`);
  },
  getDireccionById(id) {
    return apiRequest(`/direcciones/${id}`);
  },
  createDireccion(payload) {
    return apiRequest('/direcciones', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateDireccion(id, payload) {
    return apiRequest(`/direcciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteDireccion(id) {
    return apiRequest(`/direcciones/${id}`, {
      method: 'DELETE',
    });
  },
  reverseGeocode(lat, lng) {
    return apiRequest(`/geocodificacion/reversa?lat=${lat}&lng=${lng}`);
  },
};
