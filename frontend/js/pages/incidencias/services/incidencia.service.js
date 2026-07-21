import { apiRequest } from '../../../core/api.js';

export const IncidenciaService = {
  getAll(page = 1, perPage = 15, cursor = null, params = {}) {
    const queryParams = new URLSearchParams();
    if (params.all) {
      queryParams.append('all', 'true');
    }
    queryParams.append('per_page', perPage);
    if (cursor) {
      queryParams.append('cursor', cursor);
    } else {
      queryParams.append('page', page);
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest(`/incidents${queryString}`);
  },
  getById(id) {
    return apiRequest(`/incidents/${id}`);
  },
  create(payload) {
    return apiRequest('/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return apiRequest(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  delete(id) {
    return apiRequest(`/incidents/${id}`, {
      method: 'DELETE',
    });
  },
  getHistorial(id, page = 1, perPage = 15, cursor = null) {
    if (cursor) return apiRequest(`/incidents/${id}/historial?cursor=${cursor}&per_page=${perPage}`);
    return apiRequest(`/incidents/${id}/historial?page=${page}&per_page=${perPage}`);
  },
  addComment(id, comentario) {
    return apiRequest(`/incidents/${id}/comentarios`, {
      method: 'POST',
      body: JSON.stringify({ comentario }),
    });
  },
};
