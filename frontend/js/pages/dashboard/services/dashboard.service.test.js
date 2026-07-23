import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DashboardService } from './dashboard.service.js';

describe('DashboardService', () => {
  let originalFetch;
  let originalLocalStorage;

  beforeEach(() => {
    originalFetch = window.fetch;
    window.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'mockData' })
      })
    );
    
    // Set dummy localstorage to avoid api.js issues
    originalLocalStorage = window.localStorage;
    window.localStorage = {
      getItem: jest.fn(() => 'dummy_token'),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
  });

  afterEach(() => {
    window.fetch = originalFetch;
    window.localStorage = originalLocalStorage;
  });

  it('getMyMenus - debería hacer request a /me/menu', async () => {
    await DashboardService.getMyMenus();
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/me/menu'),
      expect.any(Object)
    );
  });

  it('getDashboardStats - debería hacer request a /dashboard/stats', async () => {
    await DashboardService.getDashboardStats();
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/dashboard/stats'),
      expect.any(Object)
    );
  });

  it('getDashboardMetricsByRole - debería hacer request a /dashboard/metrics?role=ROLE', async () => {
    await DashboardService.getDashboardMetricsByRole('Admin');
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/dashboard/metrics?role=Admin'),
      expect.any(Object)
    );
  });
});
