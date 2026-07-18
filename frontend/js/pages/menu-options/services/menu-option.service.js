import { apiRequest } from '../../../core/api.js';

export const MenuOptionService = {
  getAll(page = 1) {
    return apiRequest(`/opciones-menu?page=${page}`);
  },
  getById(id) {
    return apiRequest(`/opciones-menu/${id}`);
  },
  create(payload) {
    return apiRequest('/opciones-menu', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return apiRequest(`/opciones-menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  delete(id) {
    return apiRequest(`/opciones-menu/${id}`, {
      method: 'DELETE',
    });
  },
};
