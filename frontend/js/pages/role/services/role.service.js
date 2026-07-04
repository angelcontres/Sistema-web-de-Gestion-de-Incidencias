import { apiRequest } from '../../../core/api.js';

export const RoleService = {
  getAll() {
    return apiRequest('/roles');
  },
  getById(id) {
    return apiRequest(`/roles/${id}`);
  },
  create(payload) {
    return apiRequest('/roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return apiRequest(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  delete(id) {
    return apiRequest(`/roles/${id}`, {
      method: 'DELETE',
    });
  },
};
