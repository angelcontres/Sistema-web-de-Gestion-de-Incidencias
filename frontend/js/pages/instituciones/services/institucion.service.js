import { apiRequest } from '../../../core/api.js';

export const InstitucionService = {
  getAll(params = {}) {
    const queryParams = new URLSearchParams(params);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest(`/instituciones${queryString}`);
  },
  getById(id) {
    return apiRequest(`/instituciones/${id}`);
  },
  create(payload) {
    return apiRequest('/instituciones', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return apiRequest(`/instituciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  delete(id) {
    return apiRequest(`/instituciones/${id}`, {
      method: 'DELETE',
    });
  },
};
