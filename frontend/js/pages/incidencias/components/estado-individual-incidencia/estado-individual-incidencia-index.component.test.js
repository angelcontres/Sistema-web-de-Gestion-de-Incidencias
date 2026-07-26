import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { EstadoIndividualIncidenciaComponent } from './estado-individual-incidencia-index.component.js';
import { IncidenciaService } from '../../services/incidencia.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

describe('EstadoIndividualIncidenciaComponent', () => {
  let originalLocationHash;

  beforeEach(() => {
    originalLocationHash = window.location.hash;
    
    // Polyfill for bootstrap tooltips if needed
    window.bootstrap = { Tooltip: jest.fn() };
    
    // Mocks
    IncidenciaService.getById = jest.fn(() => Promise.resolve({
      id: '1',
      created_at: new Date().toISOString(),
      incidencia_descripcion: 'Test',
      direccion: { detalle: 'Test dir' },
      cantidad_afectados_incidencia: 5,
      institucion: { nombre: 'Test inst' },
      prioridad: { color_hex: '#000', nombre: 'Alta' },
      estado: { nombre: 'Nuevo' },
      estado_id: 1,
      reportantes: [{id: 1, name: 'Rep 1'}, {id: 2, name: 'Rep 2'}, {id: 3, name: 'Rep 3'}, {id: 4, name: 'Rep 4'}]
    }));
    
    IncidenciaService.getHistorial = jest.fn(() => Promise.resolve({
      data: [
        { id: 1, comentario: 'Test 1', created_at: new Date().toISOString(), usuario: { name: 'User 1' } },
        { id: 2, comentario: '[VINCULADO] Test', created_at: new Date().toISOString() },
        { id: 3, comentario: '[RESOLUCIÓN] Test', created_at: new Date().toISOString(), estado: { nombre: 'Resuelto' } }
      ],
      current_page: 1,
      last_page: 2
    }));
    
    IncidenciaService.addComment = jest.fn(() => Promise.resolve({
      data: { id: 9, comentario: 'New comment', created_at: new Date().toISOString() }
    }));
    
    AuthService.getCurrentUser = jest.fn(() => ({ id: 1, roles: [{ nombre: 'Ciudadano' }] }));
    ToastService.error = jest.fn();
    ToastService.warning = jest.fn();
    
    document.body.innerHTML = `
      <app-estado-individual-incidencia></app-estado-individual-incidencia>
    `;
    
    // Mock the HTML template fetch for BaseComponent
    window.fetch = jest.fn(async (url) => {
      if (url.includes('.html')) {
        return {
          ok: true,
          text: async () => `
            <div>
              <div id="lbl-descripcion-header"></div>
              <div id="lbl-fecha-registro"></div>
              <div id="lbl-direccion"></div>
              <div id="lbl-afectados"></div>
              <div id="lbl-institucion"></div>
              <div id="lbl-prioridad"></div>
              <div id="lbl-estado"></div>
              <div id="timeline-container"></div>
              <div id="container-reportantes" class="d-none"></div>
              <div id="list-reportantes"></div>
              <div id="container-adjuntos">
                <div id="no-adjuntos-msg"></div>
              </div>
              <div id="loading-more" class="d-none"></div>
              <div id="chat-container" style="height: 100px; overflow: auto;"></div>
              <div id="comments-list"></div>
              <div class="card-footer"></div>
              <form id="form-comentario">
                <textarea id="nuevo-comentario"></textarea>
                <span id="chat-char-count">0</span>
                <button id="btn-enviar-comentario"></button>
              </form>
            </div>
          `
        };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  afterEach(() => {
    window.location.hash = originalLocationHash;
    document.body.innerHTML = '';
  });

  const getComponent = async () => {
    const component = document.querySelector('app-estado-individual-incidencia');
    await component.onInit();
    await Promise.resolve();
    return component;
  };

  it('onInit - redirecciona si no hay ID', async () => {
    window.location.hash = '#/tramites/estado-individual';
    const component = document.querySelector('app-estado-individual-incidencia');
    await component.onInit();
    expect(ToastService.error).toHaveBeenCalled();
  });

  it('onInit - carga historial y oculta form para Supervisor', async () => {
    window.location.hash = '#/tramites/estado-individual?id=1';
    
    const component = document.querySelector('app-estado-individual-incidencia');
    component.currentUser = { id: 1, roles: [{ nombre: 'Supervisor' }] };
    
    await component.onInit();
    await Promise.resolve();
    
    expect(IncidenciaService.getById).toHaveBeenCalledWith('1');
    expect(IncidenciaService.getHistorial).toHaveBeenCalledWith('1', 1);
    
    const formContainer = component.querySelector('.card-footer');
    expect(formContainer.style.display).toBe('none');
  });

  it('setupEventListeners - char count update', async () => {
    window.location.hash = '#/tramites/estado-individual?id=1';
    const component = await getComponent();
    
    const textarea = component.querySelector('#nuevo-comentario');
    textarea.value = 'test';
    textarea.dispatchEvent(new Event('input'));
    
    expect(component.querySelector('#chat-char-count').textContent).toBe('4');
  });

  it('setupEventListeners - submit form', async () => {
    window.location.hash = '#/tramites/estado-individual?id=1';
    const component = await getComponent();
    
    const textarea = component.querySelector('#nuevo-comentario');
    textarea.value = 'mi comentario';
    
    const form = component.querySelector('#form-comentario');
    form.dispatchEvent(new Event('submit'));
    
    await Promise.resolve(); // wait for fetch
    expect(IncidenciaService.addComment).toHaveBeenCalledWith('1', 'mi comentario');
  });

  it('enviarComentario - no envía si excede limite', async () => {
    window.location.hash = '#/tramites/estado-individual?id=1';
    const component = await getComponent();
    
    const textarea = component.querySelector('#nuevo-comentario');
    textarea.value = 'A'.repeat(201);
    await component.enviarComentario();
    
    expect(ToastService.warning).toHaveBeenCalled();
  });

  it('cargarHistorial - manejo de paginación infinita al hacer scroll', async () => {
    window.location.hash = '#/tramites/estado-individual?id=1';
    const component = await getComponent();
    
    const chatContainer = component.querySelector('#chat-container');
    chatContainer.scrollTop = 0;
    component.hasMore = true;
    component.isLoadingHistory = false;
    
    chatContainer.dispatchEvent(new Event('scroll'));
    expect(IncidenciaService.getHistorial).toHaveBeenCalledWith('1', 2);
  });

  it('renderDetalles - renders correctly with attachments', async () => {
    window.location.hash = '#/tramites/estado-individual?id=1';
    IncidenciaService.getById = jest.fn(() => Promise.resolve({
      id: '1', created_at: new Date().toISOString(),
      recursos: [{ url: 'http://test.com/img.jpg' }, { url: 'http://test.com/doc.pdf' }]
    }));
    
    const component = await getComponent();
    
    const adjuntos = component.querySelector('#container-adjuntos');
    expect(adjuntos.innerHTML).toContain('img.jpg');
    expect(adjuntos.innerHTML).toContain('doc.pdf');
  });

  it('renderTimeline - correctly builds timeline based on status', async () => {
    window.location.hash = '#/tramites/estado-individual?id=1';
    IncidenciaService.getById = jest.fn(() => Promise.resolve({
      id: '1', created_at: new Date().toISOString(), estado_id: 5 // Rechazado
    }));
    const component = await getComponent();
    const timeline = component.querySelector('#timeline-container');
    expect(timeline.innerHTML).toContain('Rechazado');
  });
  it('crearBurbujaChat - covers R1 and R2 by using optional chaining and subroutines', async () => {
    const component = await getComponent();
    
    // Simulating an item with optional chaining cases
    const item = {
      usuario_id: 1,
      created_at: new Date().toISOString(),
      comentario: '[RESOLUCIÓN] test res',
      estado: { nombre: 'Resuelto' }
    };
    
    // Calling the refactored function that proves R1 (subroutines) and R2 (optional chaining)
    const bubble = component.crearBurbujaChat(item);
    
    expect(bubble.innerHTML).toContain('test res');
    expect(bubble.innerHTML).toContain('Resuelto');
  });

  it('parseComentario - correctly parses different comments (R1)', async () => {
    const component = await getComponent();
    
    let result = component.parseComentario('[VINCULADO] 123');
    expect(result.comentario).toContain('Alguien más se vinculó');
    expect(result.isStateChange).toBe(false);
    
    result = component.parseComentario('[RESOLUCIÓN] res');
    expect(result.comentario).toBe('res');
    expect(result.isStateChange).toBe(true);
  });
});
