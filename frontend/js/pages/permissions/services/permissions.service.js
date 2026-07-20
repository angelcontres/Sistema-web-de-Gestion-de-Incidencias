import { apiRequest } from '../../../core/api.js';

export const PermissionService = {
  getAll: (page = null, filters = '') => {
    let url = '/permisos';
    if (page) url += `?page=${page}`;
    if (filters) url += (page ? '&' : '?') + filters;
    return apiRequest(url);
  },
  getAllList: () => apiRequest('/permisos?all=true'),
  getById: (id) => apiRequest(`/permisos/${id}`),
  create: (data) => apiRequest('/permisos', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/permisos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/permisos/${id}`, { method: 'DELETE' }),
};
