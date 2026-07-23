import { apiRequest } from '../../../core/api.js';

export const UbicacionesService = {
  // --- PAISES ---
  getPaises() {
    return apiRequest('/countries?all=true');
  },
  getPaisById(id) {
    return apiRequest(`/countries/${id}`);
  },
  createPais(payload) {
    return apiRequest('/countries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updatePais(id, payload) {
    return apiRequest(`/countries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deletePais(id) {
    return apiRequest(`/countries/${id}`, {
      method: 'DELETE',
    });
  },

  // --- TERRITORIOS ---
  getTerritorios(page = 1, perPage = 15, cursor = null, params = {}) {
    const queryParams = new URLSearchParams();
    if (params.pais_id) queryParams.append('pais_id', params.pais_id);
    if (params.parent_id !== undefined) {
      queryParams.append('parent_id', params.parent_id === null ? 'null' : params.parent_id);
    }
    queryParams.append('per_page', perPage);
    if (cursor) {
      queryParams.append('cursor', cursor);
    } else {
      queryParams.append('page', page);
    }
    if (params.all) queryParams.append('all', 'true');
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest(`/territories${queryString}`);
  },
  getTerritorioById(id) {
    return apiRequest(`/territories/${id}`);
  },
  createTerritorio(payload) {
    return apiRequest('/territories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateTerritorio(id, payload) {
    return apiRequest(`/territories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteTerritorio(id) {
    return apiRequest(`/territories/${id}`, {
      method: 'DELETE',
    });
  },

  // --- DIRECCIONES ---
  getDirecciones(page = 1, perPage = 15, cursor = null, params = {}) {
    const queryParams = new URLSearchParams();
    if (params.territorio_id) queryParams.append('territorio_id', params.territorio_id);
    queryParams.append('per_page', perPage);
    if (cursor) {
      queryParams.append('cursor', cursor);
    } else {
      queryParams.append('page', page);
    }
    if (params.all) queryParams.append('all', 'true');
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest(`/addresses${queryString}`);
  },
  getDireccionById(id) {
    return apiRequest(`/addresses/${id}`);
  },
  createDireccion(payload) {
    return apiRequest('/addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateDireccion(id, payload) {
    return apiRequest(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteDireccion(id) {
    return apiRequest(`/addresses/${id}`, {
      method: 'DELETE',
    });
  },
  reverseGeocode(lat, lng) {
    return apiRequest(`/geocoding/reverse?lat=${lat}&lng=${lng}`);
  },
};
