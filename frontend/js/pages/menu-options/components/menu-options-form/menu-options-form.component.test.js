import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MenuOptionsFormComponent } from './menu-options-form.component.js';
import { MenuOptionService } from '../../services/menu-option.service.js';

describe('MenuOptionsFormComponent', () => {
  function createMockComponent() {
    const component = new MenuOptionsFormComponent();
    const fakeElements = {};

    component.querySelector = jest.fn((selector) => {
      if (!fakeElements[selector]) {
        fakeElements[selector] = {
          addEventListener: jest.fn(),
          classList: { add: jest.fn(), remove: jest.fn() },
          value: '',
          checked: false,
          checkValidity: jest.fn(() => true),
          appendChild: jest.fn(),
          style: {}
        };
      }
      return fakeElements[selector];
    });

    component.querySelectorAll = jest.fn(() => []);
    return { component, fakeElements };
  }

  beforeEach(() => {
    MenuOptionService.getById = jest.fn(() => Promise.resolve({
      data: { id: 1, nombre: 'Menu 1', ruta: '/menu1', icono: 'icon-1' }
    }));
    MenuOptionService.getAll = jest.fn(() => Promise.resolve({ data: [] }));
    MenuOptionService.create = jest.fn(() => Promise.resolve({ message: 'Creado' }));
    MenuOptionService.update = jest.fn(() => Promise.resolve({ message: 'Actualizado' }));
    
    global.document.createElement = jest.fn(() => ({}));
    
    window.location.hash = '';
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('onInit - carga detalles si hay ID en la URL', async () => {
    window.location.hash = '#/form?id=1';
    const { component, fakeElements } = createMockComponent();
    
    await component.onInit();
    
    expect(MenuOptionService.getById).toHaveBeenCalledWith('1');
    expect(fakeElements['#nombre'].value).toBe('Menu 1');
  });

  it('onInit - submit crea un nuevo registro', async () => {
    const { component, fakeElements } = createMockComponent();
    
    let submitCallback;
    // Sobrescribimos addEventListener ANTES de que onInit lo consulte
    component.querySelector('#opcionMenuForm').addEventListener = jest.fn((e, cb) => {
      if (e === 'submit') submitCallback = cb;
    });
    
    await component.onInit();
    
    // Set values AFTER onInit logic has attached everything
    fakeElements['#nombre'].value = 'Nuevo';
    fakeElements['#ruta'].value = '/nuevo';
    fakeElements['#icono'].value = 'icon';
    fakeElements['#padre_id'].value = '';
    
    fakeElements['#alertMessage'] = { style: {}, classList: { remove: jest.fn(), add: jest.fn() }, scrollIntoView: jest.fn() };
    
    const e = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    await submitCallback(e);
    
    expect(MenuOptionService.create).toHaveBeenCalledWith({
      nombre: 'Nuevo',
      icono: 'icon',
      ruta: '/nuevo',
      padre_id: null
    });
    
    jest.runAllTimers();
    expect(window.location.hash).toBe('#/opciones-menu');
  });
});
