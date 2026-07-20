import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DashboardComponent } from './dashboard.component.js';
import { AuthService } from '../../../../core/auth.service.js';

describe('DashboardComponent', () => {
  const originalIsAdmin = AuthService.isAdmin;
  const originalGetCurrentUser = AuthService.getCurrentUser;
  const originalHasPermission = AuthService.hasPermission;
  const originalFetch = window.fetch;

  let lastApiRequestUrl = null;

  function setupMocks() {
    lastApiRequestUrl = null;
    AuthService.isAdmin = jest.fn(() => true);
    AuthService.getCurrentUser = jest.fn(() => ({ name: 'Test User' }));
    AuthService.hasPermission = jest.fn(() => true);

    window.fetch = jest.fn(async (url) => {
      let endpoint = url;
      if (url.includes('/api/v1')) {
        endpoint = url.substring(url.indexOf('/api/v1') + 7);
      }
      lastApiRequestUrl = endpoint;

      if (endpoint === '/me/menu') {
        return {
          ok: true,
          json: async () => ({ data: [{ nombre: 'Inicio', icono: 'bi-house' }] }),
        };
      }
      if (endpoint === '/dashboard/stats') {
        return {
          ok: true,
          json: async () => ({
            servicios_mas_utilizados: [{ nombre: 'Test', porcentaje: 50, color: 'primary' }],
            recientes: [],
            mapa_reportes: [],
          }),
        };
      }
      if (endpoint.includes('/dashboard/metrics')) {
        return { ok: true, json: async () => ({ data: { kpis: {} } }) };
      }
      return { ok: true, json: async () => ({ data: [] }) };
    });

    if (!window.localStorage) {
      window.localStorage = {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
      };
    }

    window.L = {
      map: () => ({ setView: () => {}, remove: () => {} }),
      control: { zoom: () => ({ addTo: () => {} }) },
      tileLayer: () => ({ addTo: () => {} }),
      circleMarker: () => ({ addTo: () => ({ bindPopup: () => {} }) }),
    };
  }

  function restoreMocks() {
    AuthService.isAdmin = originalIsAdmin;
    AuthService.getCurrentUser = originalGetCurrentUser;
    AuthService.hasPermission = originalHasPermission;
    window.fetch = originalFetch;
  }

  function createMockComponent() {
    const component = new DashboardComponent();

    const fakeElements = {};
    const createFakeElement = () => ({
      textContent: '',
      innerHTML: '',
      classList: { add: () => {}, remove: () => {} },
      appendChild: () => {},
      querySelectorAll: () => [],
      addEventListener: () => {},
    });

    component.querySelector = (selector) => {
      if (!fakeElements[selector]) {
        fakeElements[selector] = createFakeElement();
      }
      return fakeElements[selector];
    };

    component.loadECharts = async () => {};
    component.loadDashboardStyles = async () => {};

    return { component, fakeElements };
  }

  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    restoreMocks();
  });

  it('initGreeting() - debería establecer el mensaje de bienvenida con el usuario actual', () => {
    const { component, fakeElements } = createMockComponent();
    component.initGreeting();

    const greetingEl = fakeElements['#dashboardGreeting'];
    expect(greetingEl.textContent).toBe('Bienvenido, Test User');
  });

  it('loadMenuData() - debería hacer fetch a la API si no hay caché en localStorage', async () => {
    window.localStorage.getItem = jest.fn(() => null);

    const { component, fakeElements } = createMockComponent();
    await component.loadMenuData();

    expect(lastApiRequestUrl).toBe('/me/menu');
    const container = fakeElements['#dashboardMenuContainer'];
    expect(container.innerHTML.includes('Inicio')).toBeTruthy();
  });

  it('loadDashboardData() - debería hacer petición a /dashboard/stats y renderizar secciones', async () => {
    const { component } = createMockComponent();

    let renderTopCalled = false;
    let renderRecentCalled = false;
    let updateMapCalled = false;

    component.renderTopServices = () => {
      renderTopCalled = true;
    };
    component.renderRecentIncidents = () => {
      renderRecentCalled = true;
    };
    component.updateMapMarkers = () => {
      updateMapCalled = true;
    };

    await component.loadDashboardData();

    expect(lastApiRequestUrl).toBe('/dashboard/stats');
    expect(renderTopCalled).toBeTruthy();
    expect(renderRecentCalled).toBeTruthy();
    expect(updateMapCalled).toBeTruthy();
  });

  it('renderRecentIncidents() - debería ocultar la tabla si no es admin', () => {
    AuthService.isAdmin = jest.fn(() => false);

    const { component, fakeElements } = createMockComponent();

    let classAdded = false;
    fakeElements['#recentIncidentsWrapper'] = {
      classList: {
        add: (c) => {
          if (c === 'd-none') classAdded = true;
        },
      },
    };

    component.renderRecentIncidents([]);
    expect(classAdded).toBeTruthy();
  });

  it('initDashboards() - debería cargar la vista Admin por defecto (si tiene el permiso)', async () => {
    const { component } = createMockComponent();

    component.querySelector = (selector) => {
      if (selector === '#grafanaKpisContainer') {
        return { innerHTML: '', appendChild: () => {} };
      }
      return null;
    };

    try {
      await component.initDashboards();
    } catch (e) {
      console.log(`Error al testear inicio de dashboards: ${e.message}`);
    }

    expect(lastApiRequestUrl).toBe('/dashboard/metrics?role=Admin');
  });

  it('disconnectedCallback() - debería limpiar el intervalo y el mapa', () => {
    const { component } = createMockComponent();

    component.clockInterval = setInterval(() => {}, 10000);

    let mapRemoved = false;
    component.map = {
      remove: () => {
        mapRemoved = true;
      },
    };

    component.disconnectedCallback();

    expect(mapRemoved).toBeTruthy();
    expect(component.map).toBeFalsy();
  });
});
