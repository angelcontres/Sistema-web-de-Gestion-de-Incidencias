import { apiRequest } from '../../../core/api.js';

export const InstitucionService = {
  getAll(params = {}) {
    const queryParams = new URLSearchParams(params);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest(`/v1/instituciones${queryString}`);
  },
  getById(id) {
    return apiRequest(`/v1/instituciones/${id}`);
  },
  create(payload) {
    return apiRequest('/v1/instituciones', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return apiRequest(`/v1/instituciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  delete(id) {
    return apiRequest(`/v1/instituciones/${id}`, {
      method: 'DELETE',
    });
  },
};
