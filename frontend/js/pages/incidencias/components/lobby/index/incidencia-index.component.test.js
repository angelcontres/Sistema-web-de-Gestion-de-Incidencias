import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { IncidenciaIndexComponent } from './incidencia-index.component.js';
import { IncidenciaService } from '../../../services/incidencia.service.js';
import { AuthService } from '../../../../../core/auth.service.js';
import { ModalService } from '../../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../../shared/services/toast.service.js';

describe('IncidenciaIndexComponent', () => {
  function createMockComponent() {
    const component = new IncidenciaIndexComponent();
    const fakeElements = {};

    component.querySelector = jest.fn((selector) => {
      if (!fakeElements[selector]) {
        fakeElements[selector] = {
          configure: jest.fn(),
          load: jest.fn(),
          addEventListener: jest.fn(),
          classList: { add: jest.fn() }
        };
      }
      return fakeElements[selector];
    });

    return { component, fakeElements };
  }

  beforeEach(() => {
    AuthService.hasPermission = jest.fn(() => true);
  });

  it('onInit - oculta botón si no hay permiso', async () => {
    AuthService.hasPermission = jest.fn(() => false);
    const { component, fakeElements } = createMockComponent();
    await component.onInit();
    
    expect(fakeElements['#btn-nuevo-registro'].classList.add).toHaveBeenCalledWith('d-none');
  });

  it('onInit - row-action editar redirecciona', async () => {
    const { component, fakeElements } = createMockComponent();
    let eventCallback;
    
    fakeElements['#tbl-datos-incidencias'] = {
      configure: jest.fn(),
      load: jest.fn(),
      addEventListener: jest.fn((e, cb) => { if(e === 'row-action') eventCallback = cb; })
    };
    
    await component.onInit();
    eventCallback({ detail: { action: 'editar', item: { id: 5 } } });
    
    expect(window.location.hash).toBe('#/incidencias/form?id=5');
  });

  it('eliminarIncidencia - debería llamar a IncidenciaService y ToastService tras confirmar', async () => {
    const { component, fakeElements } = createMockComponent();
    ModalService.confirm = jest.fn(() => Promise.resolve(true));
    IncidenciaService.delete = jest.fn(() => Promise.resolve());
    ToastService.success = jest.fn();

    await component.eliminarIncidencia(10);

    expect(ModalService.confirm).toHaveBeenCalled();
    expect(IncidenciaService.delete).toHaveBeenCalledWith(10);
    expect(ToastService.success).toHaveBeenCalled();
    expect(fakeElements['#tbl-datos-incidencias'].load).toHaveBeenCalled();
  });
});
