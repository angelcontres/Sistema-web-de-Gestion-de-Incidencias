import { jest, describe, it, expect } from '@jest/globals';
import { HistorialIndexComponent } from './historial-index.component.js';
import { IncidenciaService } from '../../services/incidencia.service.js';

describe('HistorialIndexComponent', () => {
  function createMockComponent() {
    const component = new HistorialIndexComponent();
    const fakeElements = {};

    component.querySelector = jest.fn((selector) => {
      if (selector === '#tbl-historial-incidencias') {
        if (!fakeElements[selector]) {
          fakeElements[selector] = {
            configure: jest.fn(),
            load: jest.fn(),
            addEventListener: jest.fn(),
          };
        }
      }
      return fakeElements[selector];
    });

    return { component, fakeElements };
  }

  it('onInit - debería configurar la tabla y cargar datos', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();

    const tblDatos = fakeElements['#tbl-historial-incidencias'];
    expect(tblDatos.configure).toHaveBeenCalled();
    expect(tblDatos.load).toHaveBeenCalledWith(IncidenciaService.getAll);
  });

  it('onInit - row-action detalle debería redireccionar', async () => {
    const { component, fakeElements } = createMockComponent();
    
    let eventCallback;
    fakeElements['#tbl-historial-incidencias'] = {
      configure: jest.fn(),
      load: jest.fn(),
      addEventListener: jest.fn((event, cb) => {
        if (event === 'row-action') eventCallback = cb;
      })
    };
    
    await component.onInit();
    
    // Simulate event
    const originalHash = window.location.hash;
    eventCallback({ detail: { action: 'detalle', item: { id: 99 } } });
    
    expect(window.location.hash).toBe('#/tramites/estado-individual?id=99');
    
    window.location.hash = originalHash;
  });
});
