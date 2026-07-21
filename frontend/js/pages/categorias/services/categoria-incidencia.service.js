import { apiRequest } from '../../../core/api.js';

export const CategoriaIncidenciaService = {
  getAll(page = 1, perPage = 15, cursor = null, parentId = undefined, params = {}) {
    const queryParams = new URLSearchParams();
    if (parentId !== undefined) {
      queryParams.append('parent_id', parentId === null ? 'null' : parentId);
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
    return apiRequest(`/incident-categories${queryString}`);
  },
  getById(id) {
    return apiRequest(`/incident-categories/${id}`);
  },
  create(payload) {
    return apiRequest('/incident-categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return apiRequest(`/incident-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  delete(id) {
    return apiRequest(`/incident-categories/${id}`, {
      method: 'DELETE',
    });
  },
};
