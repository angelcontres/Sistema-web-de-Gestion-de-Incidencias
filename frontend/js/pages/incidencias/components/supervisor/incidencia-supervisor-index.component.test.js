import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { IncidenciaSupervisorIndexComponent } from './incidencia-supervisor-index.component.js';
import { IncidenciaService } from '../../services/incidencia.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';

describe('IncidenciaSupervisorIndexComponent', () => {
  function createMockComponent() {
    const component = new IncidenciaSupervisorIndexComponent();
    const fakeElements = {};

    component.querySelector = jest.fn((selector) => {
      if (!fakeElements[selector]) {
        fakeElements[selector] = {
          addEventListener: jest.fn(),
          innerHTML: '',
          appendChild: jest.fn(),
          textContent: '',
          classList: { remove: jest.fn(), add: jest.fn() }
        };
      }
      return fakeElements[selector];
    });

    return { component, fakeElements };
  }

  beforeEach(() => {
    IncidenciaService.getAll = jest.fn(() => Promise.resolve({ data: [] }));
    window.L = {
      map: jest.fn(() => ({ setView: jest.fn(() => ({})), removeLayer: jest.fn(), fitBounds: jest.fn() })),
      tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
      marker: jest.fn(() => ({ addTo: jest.fn(() => ({ bindPopup: jest.fn() })) })),
      Icon: jest.fn(),
      featureGroup: jest.fn(() => ({ getBounds: jest.fn(() => ({ pad: jest.fn() })) }))
    };
    window.bootstrap = { Modal: jest.fn(() => ({ show: jest.fn(), hide: jest.fn() })) };
  });
  
  afterEach(() => {
      delete window.L;
      delete window.bootstrap;
  });

  it('cargarDatos - debería cargar incidencias y actualizar render', async () => {
    const { component } = createMockComponent();
    component.renderAlertas = jest.fn();
    component.initOrUpdateMap = jest.fn();
    
    await component.cargarDatos();

    expect(IncidenciaService.getAll).toHaveBeenCalled();
    expect(component.renderAlertas).toHaveBeenCalled();
    expect(component.initOrUpdateMap).toHaveBeenCalled();
  });

  it('despacharIncidencia - aborta si no confirma', async () => {
    const { component } = createMockComponent();
    component.incidenciaSeleccionada = { id: 1 };
    ModalService.confirm = jest.fn(() => Promise.resolve(false));
    IncidenciaService.update = jest.fn();

    await component.despacharIncidencia();

    expect(IncidenciaService.update).not.toHaveBeenCalled();
  });
});
