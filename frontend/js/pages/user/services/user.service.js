import { apiRequest } from '../../../core/api.js';

export const UserService = {
  getAll(page = 1, perPage = 15, cursor = null) {
    let url = `/users?`;
    if (cursor) {
      url += `cursor=${cursor}&per_page=${perPage}`;
    } else {
      url += `page=${page}&per_page=${perPage}`;
    }
    return apiRequest(url);
  },
  getById(id) {
    return apiRequest(`/users/${id}`);
  },
  create(payload) {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  delete(id) {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};
