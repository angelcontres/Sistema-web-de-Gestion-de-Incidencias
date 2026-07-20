import { apiRequest } from '../../../core/api.js';

export const DashboardService = {
  getMyMenus() {
    return apiRequest('/me/menu');
  },

  getDashboardStats() {
    return apiRequest('/dashboard/stats');
  },

  getDashboardMetricsByRole(role) {
    return apiRequest(`/dashboard/metrics?role=${role}`);
  },
};

// ---- ADMIN ----
