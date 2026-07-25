import { apiRequest } from '../../../core/api.js';

export const PermissionService = {
  getAll: (page = null, filters = '') => {
    let url = '/permissions';
    if (page) url += `?page=${page}`;
    if (filters) url += (page ? '&' : '?') + filters;
    return apiRequest(url);
  },
  getAllList: () => apiRequest('/permissions?all=true'),
  getById: (id) => apiRequest(`/permissions/${id}`),
  create: (data) => apiRequest('/permissions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/permissions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/permissions/${id}`, { method: 'DELETE' }),
};
