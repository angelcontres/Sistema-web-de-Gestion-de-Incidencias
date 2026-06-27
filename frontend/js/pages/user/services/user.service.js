import { apiRequest } from '../../../core/api.js';

export const UserService = {
  getAll() {
    return apiRequest('/v1/usuarios');
  },
  getById(id) {
    return apiRequest(`/v1/usuarios/${id}`);
  },
  create(payload) {
    return apiRequest('/v1/usuarios', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  update(id, payload) {
    return apiRequest(`/v1/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  delete(id) {
    return apiRequest(`/v1/usuarios/${id}`, {
      method: 'DELETE'
    });
  }
};
