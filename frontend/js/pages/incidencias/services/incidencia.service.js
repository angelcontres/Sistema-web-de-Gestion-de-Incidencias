import { apiRequest } from '../../../core/api.js';

export const IncidenciaService = {
  getAll(page = 1, cursor = null) {
    if (cursor) return apiRequest(`/incidencias?cursor=${cursor}`);
    return apiRequest(`/incidencias?page=${page}`);
  },
  getById(id) {
    return apiRequest(`/incidencias/${id}`);
  },
  create(payload) {
    return apiRequest('/incidencias', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return apiRequest(`/incidencias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  delete(id) {
    return apiRequest(`/incidencias/${id}`, {
      method: 'DELETE',
    });
  },
  getHistorial(id, page = 1, cursor = null) {
    if (cursor) return apiRequest(`/incidencias/${id}/historial?cursor=${cursor}`);
    return apiRequest(`/incidencias/${id}/historial?page=${page}`);
  },
  addComment(id, comentario) {
    return apiRequest(`/incidencias/${id}/comentarios`, {
      method: 'POST',
      body: JSON.stringify({ comentario }),
    });
  },
};
