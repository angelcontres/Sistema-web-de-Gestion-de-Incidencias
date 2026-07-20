import { apiRequest } from '../../../../../core/api.js';

export const PermissionService = {
  getAll: (page = 1, filters = '') => apiRequest(`/permissions?page=${page}${filters ? '&' + filters : ''}`),
  getAllList: () => apiRequest('/permissions?all=true'),
  getById: (id) => apiRequest(`/permissions/${id}`),
  create: (data) => apiRequest('/permissions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/permissions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/permissions/${id}`, { method: 'DELETE' }),
};
