import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DashboardAdminComponent } from './dashboard-admin.component.js';

describe('DashboardAdminComponent', () => {
  let originalEcharts;

  beforeEach(() => {
    originalEcharts = window.echarts;
    window.echarts = {
      init: jest.fn(() => ({
        setOption: jest.fn(),
        resize: jest.fn(),
      })),
      graphic: {
        LinearGradient: jest.fn(),
      }
    };
    jest.useFakeTimers();
  });

  afterEach(() => {
    window.echarts = originalEcharts;
    jest.useRealTimers();
  });

  function createMockComponent() {
    const component = new DashboardAdminComponent();
    const fakeElements = {};
    const createFakeElement = () => ({
      textContent: '',
      classList: { add: jest.fn(), remove: jest.fn() },
    });

    component.querySelector = (selector) => {
      if (!fakeElements[selector]) {
        fakeElements[selector] = createFakeElement();
      }
      return fakeElements[selector];
    };
    
    return { component, fakeElements };
  }

  it('debería inicializarse con el roleName correcto', () => {
    const { component } = createMockComponent();
    expect(component.roleName).toBe('Admin');
  });

  it('onInit() - debería llamar a renderData si dashboardData está definido', () => {
    const { component } = createMockComponent();
    component.renderData = jest.fn();
    component.dashboardData = { kpis: {} };
    component.onInit();
    expect(component.renderData).toHaveBeenCalled();
  });

  it('set data - debería actualizar dashboardData y llamar a renderData si la vista está lista', () => {
    const { component, fakeElements } = createMockComponent();
    component.renderData = jest.fn();
    
    const mockData = { kpis: { totales: 10 } };
    fakeElements['#val-totales'] = {}; // Simulamos que el elemento existe
    
    component.data = mockData;
    
    expect(component.dashboardData).toEqual(mockData);
    expect(component.renderData).toHaveBeenCalled();
  });

  it('renderData() - debería poblar los KPIs y configurar ECharts', () => {
    const { component, fakeElements } = createMockComponent();
    component.dashboardData = {
      kpis: {
        totales: 100,
        sin_asignar: 5,
        pendientes: 10,
        resueltas: 85
      },
      distribucion_estado: [{ metric: 'Pendiente', value: 10 }],
      incidencias_institucion: [{ metric: 'Policía', value: 50 }],
      tendencia_temporal: [{ metric: '2023-01-01', value: 5 }]
    };

    component.renderData();

    expect(fakeElements['#val-totales'].textContent).toBe(100);
    expect(fakeElements['#val-sin-asignar'].textContent).toBe(5);
    expect(fakeElements['#val-pendientes'].textContent).toBe(10);
    expect(fakeElements['#val-resueltas'].textContent).toBe(85);
    expect(fakeElements['#title-tendencia'].textContent).toBe('Tendencia Temporal (Admin)');
    
    expect(fakeElements['#badge-rezagos'].classList.remove).toHaveBeenCalledWith('d-none');

    // Avanzar temporizadores para que se ejecute el setTimeout de echarts
    jest.runAllTimers();
    
    expect(window.echarts.init).toHaveBeenCalledTimes(3); // chartEstado, chartInstitucion, chartTendencia
  });
});
