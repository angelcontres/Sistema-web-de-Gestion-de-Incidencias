import { apiRequest } from '../../../core/api.js';

export const RoleService = {
  getAll(page = 1, perPage = 15, cursor = null, params = {}) {
    const queryParams = new URLSearchParams();
    queryParams.append('per_page', perPage);
    if (params.all) {
      queryParams.append('all', 'true');
    }
    if (cursor) {
      queryParams.append('cursor', cursor);
    } else {
      queryParams.append('page', page);
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest(`/roles${queryString}`);
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
