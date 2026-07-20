import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { KanbanIndexComponent } from './kanban-index.component.js';
import { IncidenciaService } from '../../../incidencias/services/incidencia.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

describe('KanbanIndexComponent', () => {
  function createMockComponent() {
    const component = new KanbanIndexComponent();
    const fakeElements = {};

    component.querySelector = jest.fn((selector) => {
      if (!fakeElements[selector]) {
        fakeElements[selector] = {
          addEventListener: jest.fn(),
          classList: { add: jest.fn(), remove: jest.fn() },
          innerHTML: '',
          textContent: '',
          value: '',
          appendChild: jest.fn(),
          disabled: false,
          click: jest.fn(),
        };
      }
      return fakeElements[selector];
    });

    component.querySelectorAll = jest.fn(() => []);

    return { component, fakeElements };
  }

  beforeEach(() => {
    IncidenciaService.getAll = jest.fn(() => Promise.resolve({ data: [] }));
    IncidenciaService.update = jest.fn(() => Promise.resolve());
    
    AuthService.hasPermission = jest.fn(() => true);
    
    ToastService.warning = jest.fn();
    ToastService.success = jest.fn();
    ToastService.error = jest.fn();

    window.bootstrap = { 
      Modal: Object.assign(jest.fn(() => ({ show: jest.fn(), hide: jest.fn() })), {
        getInstance: jest.fn(() => ({ hide: jest.fn() }))
      }) 
    };
    
    global.document.createElement = jest.fn((tag) => {
      return {
        className: '',
        innerHTML: '',
        querySelector: jest.fn(() => ({ addEventListener: jest.fn() }))
      };
    });
  });

  afterEach(() => {
    delete window.bootstrap;
    jest.restoreAllMocks();
  });

  it('cargarIncidencias - obtiene y renderiza las incidencias separadas por estado', async () => {
    const { component, fakeElements } = createMockComponent();
    
    IncidenciaService.getAll = jest.fn(() => Promise.resolve({
      data: [
        { id: 1, estado_id: 3, created_at: new Date().toISOString() }, // En Proceso
        { id: 2, estado_id: 3, created_at: new Date().toISOString() }, // En Proceso
        { id: 3, estado_id: 4, created_at: new Date().toISOString() }, // Resuelta
      ]
    }));

    await component.cargarIncidencias();

    expect(IncidenciaService.getAll).toHaveBeenCalled();
    expect(fakeElements['#count-proceso'].textContent).toBe(2);
    expect(fakeElements['#count-resuelto'].textContent).toBe(1);
    expect(fakeElements['#col-en-proceso'].appendChild).toHaveBeenCalledTimes(2);
    expect(fakeElements['#col-resuelto'].appendChild).toHaveBeenCalledTimes(1);
  });

  it('abrirModalResolver - debería limpiar campos y mostrar el modal', () => {
    const { component, fakeElements } = createMockComponent();
    
    component.recursosFiles = [{ name: 'test.jpg' }]; // simulated existing file
    component.abrirModalResolver(10, 2);
    
    expect(fakeElements['#resolver-incidencia-id'].value).toBe(10);
    expect(fakeElements['#resolver-incidencia-version'].value).toBe(2);
    expect(fakeElements['#resolver-comentario'].value).toBe('');
    expect(fakeElements['#char-count'].textContent).toBe('0');
    expect(component.recursosFiles.length).toBe(0); // Debería haberlo limpiado
    
    expect(window.bootstrap.Modal).toHaveBeenCalled();
  });

  it('resolverIncidencia - falla si el comentario está vacío', async () => {
    const { component, fakeElements } = createMockComponent();
    fakeElements['#resolver-comentario'] = { value: '   ' };
    
    await component.resolverIncidencia();
    
    expect(ToastService.warning).toHaveBeenCalledWith('Debes ingresar un comentario de resolución.');
    expect(IncidenciaService.update).not.toHaveBeenCalled();
  });

  it('resolverIncidencia - falla si no hay recursos (imágenes)', async () => {
    const { component, fakeElements } = createMockComponent();
    fakeElements['#resolver-comentario'] = { value: 'Se resolvió la tubería.' };
    component.recursosFiles = []; // Sin archivos
    
    await component.resolverIncidencia();
    
    expect(ToastService.warning).toHaveBeenCalledWith('Debes adjuntar al menos una imagen de evidencia.');
    expect(IncidenciaService.update).not.toHaveBeenCalled();
  });

  it('resolverIncidencia - éxito cuando se envían comentario y evidencias', async () => {
    const { component, fakeElements } = createMockComponent();
    fakeElements['#resolver-incidencia-id'] = { value: 5 };
    fakeElements['#resolver-incidencia-version'] = { value: 1 };
    fakeElements['#resolver-comentario'] = { value: 'Arreglado exitosamente.' };
    fakeElements['#btn-confirmar-resolver'] = { disabled: false };
    
    component.recursosFiles = [{ base64: 'data:image/webp;base64,ABC...' }];
    component.cargarIncidencias = jest.fn(); // mock internal method
    
    await component.resolverIncidencia();
    
    expect(IncidenciaService.update).toHaveBeenCalledWith(5, {
      estado_id: 4,
      version: 1,
      comentario_estado: '[RESOLUCIÓN] Arreglado exitosamente.',
      recursos: ['data:image/webp;base64,ABC...']
    });
    
    expect(ToastService.success).toHaveBeenCalledWith('Incidencia marcada como resuelta.');
    expect(component.cargarIncidencias).toHaveBeenCalled();
  });

  it('processFiles - debería rechazar archivos grandes o no-imágenes', async () => {
    const { component } = createMockComponent();
    
    // Test No Imagen
    const invalidFile = { type: 'application/pdf', size: 100, name: 'test.pdf' };
    await component.processFiles([invalidFile]);
    expect(ToastService.warning).toHaveBeenCalledWith('Solo se permiten archivos de imagen.');
    expect(component.recursosFiles.length).toBe(0);

    // Test Tamaño excesivo (11MB)
    const bigFile = { type: 'image/jpeg', size: 11 * 1024 * 1024, name: 'big.jpg' };
    await component.processFiles([bigFile]);
    expect(ToastService.warning).toHaveBeenCalledWith('La imagen no debe superar el límite de 10 MB.');
  });
});
