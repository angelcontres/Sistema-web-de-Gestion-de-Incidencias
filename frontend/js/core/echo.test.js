import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const mockEcho = jest.fn();

jest.unstable_mockModule('https://esm.sh/laravel-echo@^1.16.0', () => ({
  default: mockEcho,
}), { virtual: true });

jest.unstable_mockModule('https://esm.sh/pusher-js@^8.4.0', () => ({
  default: jest.fn(),
}), { virtual: true });

jest.unstable_mockModule('../../environment/environment.js', () => ({
  environment: { apiBaseUrl: 'http://test-api.com' },
}));

const { initEcho } = await import('./echo.js');

describe('initEcho', () => {
  beforeEach(() => {
    localStorage.clear();
    mockEcho.mockReset();
  });

  it('returns null when no auth token in localStorage', () => {
    expect(initEcho()).toBeNull();
  });

  it('creates and returns an Echo instance when auth token is present', () => {
    localStorage.setItem('access_token', 'test-token');
    const result = initEcho();
    expect(mockEcho).toHaveBeenCalledTimes(1);
    expect(mockEcho).toHaveBeenCalledWith(expect.objectContaining({
      authEndpoint: 'http://test-api.com/broadcasting/auth',
      auth: {
        headers: {
          Authorization: 'Bearer test-token',
          Accept: 'application/json',
        },
      },
    }));
    expect(result).toBeInstanceOf(mockEcho);
  });
});
