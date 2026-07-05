import { apiRequest } from '../../../core/api.js';

export const IncidenciaService = {
  getAll() {
    return apiRequest('/incidencias');
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
};
