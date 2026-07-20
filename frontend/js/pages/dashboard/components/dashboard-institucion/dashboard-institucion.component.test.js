import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DashboardInstitucionComponent } from './dashboard-institucion.component.js';

describe('DashboardInstitucionComponent', () => {
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
    const component = new DashboardInstitucionComponent();
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
    
    const mockData = { kpis: { asignadas: 10 } };
    fakeElements['#val-asignadas'] = {}; // Simulamos que el elemento existe
    
    component.data = mockData;
    
    expect(component.dashboardData).toEqual(mockData);
    expect(component.renderData).toHaveBeenCalled();
  });

  it('renderData() - debería poblar los KPIs y configurar ECharts', () => {
    const { component, fakeElements } = createMockComponent();
    component.dashboardData = {
      kpis: {
        asignadas: 20,
        en_proceso: 5,
        resueltas: 15
      },
      distribucion_estado: [{ metric: 'Pendiente', value: 10 }],
      tendencia_temporal: [{ metric: '2023-01-01', value: 5 }]
    };

    component.renderData();

    expect(fakeElements['#val-asignadas'].textContent).toBe(20);
    expect(fakeElements['#val-en-proceso'].textContent).toBe(5);
    expect(fakeElements['#val-resueltas'].textContent).toBe(15);

    // Avanzar temporizadores para que se ejecute el setTimeout de echarts
    jest.runAllTimers();
    
    expect(window.echarts.init).toHaveBeenCalledTimes(2); // chartEstado, chartTendencia
  });
});
