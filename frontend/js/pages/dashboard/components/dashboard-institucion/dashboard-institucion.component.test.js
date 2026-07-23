import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DashboardInstitucionComponent } from './dashboard-institucion.component.js';

describe('DashboardInstitucionComponent', () => {
  let originalEcharts;

  // Creamos variables para guardar las referencias de los gráficos creados en el test
  let mockChartEstado;
  let mockChartTendencia;

  beforeEach(() => {
    originalEcharts = window.echarts;

    // Inicializamos los mocks individuales con sus funciones espía (jest.fn())
    mockChartEstado = { setOption: jest.fn(), resize: jest.fn() };
    mockChartTendencia = { setOption: jest.fn(), resize: jest.fn() };

    window.echarts = {
      init: jest.fn().mockReturnValueOnce(mockChartEstado).mockReturnValueOnce(mockChartTendencia),
      graphic: {
        LinearGradient: jest.fn(),
      },
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
        resueltas: 15,
      },
      distribucion_estado: [{ metric: 'Pendiente', value: 10 }],
      tendencia_temporal: [{ metric: '2023-01-01', value: 5 }],
    };

    component.renderData();

    expect(fakeElements['#val-asignadas'].textContent).toBe(20);
    expect(fakeElements['#val-en-proceso'].textContent).toBe(5);
    expect(fakeElements['#val-resueltas'].textContent).toBe(15);

    // Avanzar temporizadores para que se ejecute el setTimeout de echarts
    jest.runAllTimers();

    expect(window.echarts.init).toHaveBeenCalledTimes(2); // chartEstado, chartTendencia
  });

  it('debería redimensionar los gráficos cuando la ventana cambia de tamaño (resize)', () => {
    const { component } = createMockComponent();
    component.dashboardData = {
      kpis: { asignadas: 1, en_proceso: 1, resueltas: 1 },
      distribucion_estado: [],
      tendencia_temporal: [],
    };

    // Ejecuta renderData para que entre en el flujo del setTimeout
    component.renderData();

    // Importante: Ejecuta los timers para que se registre el callback en el window 'resize'
    jest.runAllTimers();

    // Simulamos el disparo del evento resize global de la ventana
    window.dispatchEvent(new Event('resize'));

    // Verificamos que se haya invocado la función .resize() de ambos gráficos mockeados
    expect(mockChartEstado.resize).toHaveBeenCalledTimes(1);
    expect(mockChartTendencia.resize).toHaveBeenCalledTimes(1);
  });
});
