import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { EstadoIndividualIncidenciaComponent } from './estado-individual-incidencia-index.component.js';
import { IncidenciaService } from '../../services/incidencia.service.js';
import { AuthService } from '../../../../core/auth.service.js';

describe('EstadoIndividualIncidenciaComponent', () => {
  function createMockComponent() {
    const component = new EstadoIndividualIncidenciaComponent();
    const fakeElements = {};

    component.querySelector = jest.fn((selector) => {
      if (!fakeElements[selector]) {
        fakeElements[selector] = {
          addEventListener: jest.fn(),
          innerHTML: '',
          textContent: '',
          classList: { add: jest.fn(), remove: jest.fn() },
          appendChild: jest.fn(),
          prepend: jest.fn(),
          value: '',
          children: []
        };
      }
      return fakeElements[selector];
    });

    return { component, fakeElements };
  }

  beforeEach(() => {
    window.location.hash = '#/tramites/estado-individual?id=1';
    IncidenciaService.getById = jest.fn(() => Promise.resolve({ 
      id: 1, created_at: new Date().toISOString() 
    }));
    IncidenciaService.getHistorial = jest.fn(() => Promise.resolve({ data: [], current_page: 1, last_page: 1 }));
    AuthService.getCurrentUser = jest.fn(() => ({ id: 1, roles: [] }));
    
    // Simulate DocumentFragment
    global.document.createDocumentFragment = jest.fn(() => ({ appendChild: jest.fn() }));
    global.document.createElement = jest.fn(() => ({ style: {}, classList: { replace: jest.fn(), add: jest.fn(), remove: jest.fn() } }));
  });

  it('onInit - carga detalles e historial si hay ID en la url', async () => {
    const { component } = createMockComponent();
    component.renderDetalles = jest.fn();
    
    await component.onInit();
    
    expect(component.incidenciaId).toBe('1');
    expect(IncidenciaService.getById).toHaveBeenCalledWith('1');
    expect(component.renderDetalles).toHaveBeenCalled();
    expect(IncidenciaService.getHistorial).toHaveBeenCalledWith('1', 1);
  });

  it('enviarComentario - llama a addComment y limpia input', async () => {
    const { component, fakeElements } = createMockComponent();
    component.incidenciaId = '1';
    fakeElements['#nuevo-comentario'] = { value: 'test comment' };
    fakeElements['#btn-enviar-comentario'] = {};
    
    IncidenciaService.addComment = jest.fn(() => Promise.resolve({ data: { created_at: new Date().toISOString() } }));
    
    await component.enviarComentario();
    
    expect(IncidenciaService.addComment).toHaveBeenCalledWith('1', 'test comment');
    expect(fakeElements['#nuevo-comentario'].value).toBe('');
  });
});
