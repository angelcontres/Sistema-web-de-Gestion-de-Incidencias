import { apiRequest } from '../../../core/api.js';

export const UserService = {
  getAll(page = 1) {
    return apiRequest(`/usuarios?page=${page}`);
  },
  getById(id) {
    return apiRequest(`/usuarios/${id}`);
  },
  create(payload) {
    return apiRequest('/usuarios', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return apiRequest(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  delete(id) {
    return apiRequest(`/usuarios/${id}`, {
      method: 'DELETE',
    });
  },
};
