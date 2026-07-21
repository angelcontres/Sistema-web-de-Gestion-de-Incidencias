import { apiRequest } from '../../../core/api.js';

export const InstitucionService = {
  getAll(page = 1, perPage = 15, cursor = null, params = {}) {
    const queryParams = new URLSearchParams();
    if (params.search) {
      queryParams.append('search', params.search);
    }
    if (params.all) {
      queryParams.append('all', 'true');
    }
    queryParams.append('per_page', perPage);
    if (cursor) {
      queryParams.append('cursor', cursor);
    } else {
      queryParams.append('page', page);
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest(`/institutions${queryString}`);
  },
  getById(id) {
    return apiRequest(`/institutions/${id}`);
  },
  create(payload) {
    return apiRequest('/institutions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return apiRequest(`/institutions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  delete(id) {
    return apiRequest(`/institutions/${id}`, {
      method: 'DELETE',
    });
  },
};
