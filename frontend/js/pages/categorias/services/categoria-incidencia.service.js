import { apiRequest } from '../../../core/api.js';

export const CategoriaIncidenciaService = {
  getAll(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.parent_id !== undefined) {
      queryParams.append('parent_id', params.parent_id === null ? '' : params.parent_id);
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest(`/categorias-incidencia${queryString}`);
  },
  getById(id) {
    return apiRequest(`/categorias-incidencia/${id}`);
  },
  create(payload) {
    return apiRequest('/categorias-incidencia', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return apiRequest(`/categorias-incidencia/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  delete(id) {
    return apiRequest(`/categorias-incidencia/${id}`, {
      method: 'DELETE',
    });
  },
};
