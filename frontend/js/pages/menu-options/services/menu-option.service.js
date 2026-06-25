import { apiRequest } from '../../../core/api.js';

export const MenuOptionService = {
  getAll() {
    return apiRequest('/v1/opciones-menu');
  },
  getById(id) {
    return apiRequest(`/v1/opciones-menu/${id}`);
  },
  create(payload) {
    return apiRequest('/v1/opciones-menu', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  update(id, payload) {
    return apiRequest(`/v1/opciones-menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  delete(id) {
    return apiRequest(`/v1/opciones-menu/${id}`, {
      method: 'DELETE'
    });
  }
};
