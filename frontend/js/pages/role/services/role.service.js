import { apiRequest } from '../../../core/api.js';

export const RoleService = {
  getAll() {
    return apiRequest('/v1/roles');
  },
  getById(id) {
    return apiRequest(`/v1/roles/${id}`);
  },
  create(payload) {
    return apiRequest('/v1/roles', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  update(id, payload) {
    return apiRequest(`/v1/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  delete(id) {
    return apiRequest(`/v1/roles/${id}`, {
      method: 'DELETE'
    });
  }
};
