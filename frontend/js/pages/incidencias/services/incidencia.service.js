import { apiRequest } from '../../../core/api.js';

export const IncidenciaService = {
  getAll() {
    return apiRequest('/v1/incidencias');
  },
  getById(id) {
    return apiRequest(`/v1/incidencias/${id}`);
  },
  create(payload) {
    return apiRequest('/v1/incidencias', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return apiRequest(`/v1/incidencias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  delete(id) {
    return apiRequest(`/v1/incidencias/${id}`, {
      method: 'DELETE',
    });
  },
};
