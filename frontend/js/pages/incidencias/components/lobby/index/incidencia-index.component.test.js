import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { IncidenciaIndexComponent } from './incidencia-index.component.js';
import { IncidenciaService } from '../../../services/incidencia.service.js';
import { AuthService } from '../../../../../core/auth.service.js';
import { ModalService } from '../../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../../shared/services/toast.service.js';

describe('IncidenciaIndexComponent', () => {
  let originalFetch;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Mock fetch for template
    originalFetch = window.fetch;
    window.fetch = jest.fn((url) => {
      if (url.includes('.html')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(`
            <button id="btn-nuevo-registro"></button>
            <div id="tbl-datos-incidencias"></div>
          `),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) });
    });

    // Reset mocks
    jest.clearAllMocks();

    // Mock permissions
    AuthService.hasPermission = jest.fn(() => true);

    // Mock services
    IncidenciaService.getAll = jest.fn();
    IncidenciaService.delete = jest.fn();
    ModalService.confirm = jest.fn();
    ToastService.success = jest.fn();
    ToastService.error = jest.fn();
    
    // Mock web component methods
    HTMLElement.prototype.configure = jest.fn();
    HTMLElement.prototype.load = jest.fn();
  });

  afterEach(() => {
    window.fetch = originalFetch;
    delete HTMLElement.prototype.configure;
    delete HTMLElement.prototype.load;
  });

  async function createComponent() {
    document.body.innerHTML = '<app-incidencia-index></app-incidencia-index>';
    const component = document.querySelector('app-incidencia-index');
    
    // Wait for connectedCallback to fetch and render
    await Promise.resolve(); // fetch
    await Promise.resolve(); // response.text
    await Promise.resolve(); // onInit
    
    const tblDatos = component.querySelector('#tbl-datos-incidencias');
    
    return { component, tblDatos };
  }

  it('should initialize and hide btn-nuevo-registro if no CREATE permission', async () => {
    AuthService.hasPermission = jest.fn((action) => action !== 'CREATE');
    const { component } = await createComponent();
    
    const btnNuevoRegistro = component.querySelector('#btn-nuevo-registro');
    expect(btnNuevoRegistro.classList.contains('d-none')).toBeTruthy();
  });

  it('should configure table columns correctly', async () => {
    const { tblDatos } = await createComponent();
    expect(tblDatos.configure).toHaveBeenCalled();
    
    const columns = tblDatos.configure.mock.calls[0][0].columns;
    
    // Find ID column
    const idCol = columns.find(c => c.key === 'id');
    expect(idCol.format(123)).toBe('#123');

    // Find Clasificación column
    const clasifCol = columns.find(c => c.header === 'Clasificación');
    expect(clasifCol.render({ tipo: { nombre: 'Tipo1' }, sub_tipo: { nombre: 'Sub1' } })).toContain('Tipo1');
    expect(clasifCol.render({ tipo: { nombre: 'Tipo2' }, subTipo: { nombre: 'Sub2' } })).toContain('Tipo2');
    expect(clasifCol.render({})).toContain('-');

    // Find Descripción column
    const descCol = columns.find(c => c.header === 'Descripción');
    expect(descCol.render({ incidencia_descripcion: 'Algo' })).toContain('Algo');
    expect(descCol.render({})).toContain('Sin descripción.');

    // Find Ubicación / Dirección column
    const ubicCol = columns.find(c => c.header === 'Ubicación / Dirección');
    expect(ubicCol.render({ direccion: { detalle: 'Calle 1', territorio: { pais: { nombre: 'Pais1' } } } })).toContain('Calle 1');
    expect(ubicCol.render({})).toContain('Sin dirección.');

    // Find Prioridad column
    const prioCol = columns.find(c => c.header === 'Prioridad');
    expect(prioCol.render({ prioridad: { nombre: 'Alta', color_hex: '#ff0000' } })).toContain('Alta');
    expect(prioCol.render({ prioridad: { nombre: 'Baja' } })).toContain('#6c757d');
    expect(prioCol.render({})).toBe('-');

    // Find Estado column
    const estadoCol = columns.find(c => c.header === 'Estado');
    expect(estadoCol.render({ estado: { nombre: 'Aprobado' } })).toContain('success');
    expect(estadoCol.render({ estado: { nombre: 'Rechazado' } })).toContain('danger');
    expect(estadoCol.render({ estado: { nombre: 'En Revisión' } })).toContain('warning');
    expect(estadoCol.render({ estado: { nombre: 'Otro' } })).toContain('secondary');
    expect(estadoCol.render({})).toBe('-');

    // Find Atendido por column
    const atenCol = columns.find(c => c.header === 'Atendido por');
    expect(atenCol.render({ institucion: { nombre: 'Inst1' } })).toContain('Inst1');
    expect(atenCol.render({})).toContain('No asignado');

    // Find Acciones column
    const accCol = columns.find(c => c.header === 'Acciones');
    expect(accCol.actions.length).toBeGreaterThan(0);
    expect(accCol.actions.find(a => a.name === 'editar')).toBeDefined();
    expect(accCol.actions.find(a => a.name === 'eliminar')).toBeDefined();
  });

  it('should not include edit or delete actions if permissions are missing', async () => {
    AuthService.hasPermission = jest.fn(() => false);
    const { tblDatos } = await createComponent();
    
    const columns = tblDatos.configure.mock.calls[0][0].columns;
    const accCol = columns.find(c => c.header === 'Acciones');
    expect(accCol.actions).toHaveLength(0);
  });

  it('should handle row-action for editar', async () => {
    const { component, tblDatos } = await createComponent();
    
    // Simulate event
    const event = new CustomEvent('row-action', {
      detail: { action: 'editar', item: { id: 7 } }
    });
    tblDatos.dispatchEvent(event);
    
    expect(window.location.hash).toBe('#/incidencias/form?id=7');
  });

  it('should handle row-action for eliminar', async () => {
    const { component, tblDatos } = await createComponent();
    
    // Mock the component method since we're testing the event routing
    component.eliminarIncidencia = jest.fn();
    
    // Simulate event
    const event = new CustomEvent('row-action', {
      detail: { action: 'eliminar', item: { id: 8 } }
    });
    tblDatos.dispatchEvent(event);
    
    expect(component.eliminarIncidencia).toHaveBeenCalledWith(8);
  });

  it('should handle missing table in onInit safely', async () => {
    document.body.innerHTML = '<app-incidencia-index></app-incidencia-index>';
    const component = document.querySelector('app-incidencia-index');
    
    // Mock a template without table
    window.fetch.mockImplementationOnce(() => Promise.resolve({
      ok: true, text: () => Promise.resolve('<div>No table</div>')
    }));
    
    await Promise.resolve(); // fetch
    await Promise.resolve(); // response.text
    await Promise.resolve(); // onInit

    // If it doesn't throw, it passed
    expect(component).toBeTruthy();
  });

  describe('eliminarIncidencia', () => {
    it('should delete and reload when confirmed', async () => {
      const { component, tblDatos } = await createComponent();
      
      ModalService.confirm.mockResolvedValueOnce(true);
      IncidenciaService.delete.mockResolvedValueOnce();
      
      await component.eliminarIncidencia(99);
      
      expect(ModalService.confirm).toHaveBeenCalled();
      expect(IncidenciaService.delete).toHaveBeenCalledWith(99);
      expect(ToastService.success).toHaveBeenCalledWith('Incidencia #99 eliminada con éxito.');
      expect(tblDatos.load).toHaveBeenCalled();
    });

    it('should show error toast when deletion fails', async () => {
      const { component } = await createComponent();
      
      ModalService.confirm.mockResolvedValueOnce(true);
      IncidenciaService.delete.mockRejectedValueOnce(new Error('Network error'));
      
      await component.eliminarIncidencia(100);
      
      expect(IncidenciaService.delete).toHaveBeenCalledWith(100);
      expect(ToastService.error).toHaveBeenCalledWith('Error al eliminar: Network error');
    });

    it('should do nothing if confirmation is cancelled', async () => {
      const { component } = await createComponent();
      
      ModalService.confirm.mockResolvedValueOnce(false);
      
      await component.eliminarIncidencia(101);
      
      expect(IncidenciaService.delete).not.toHaveBeenCalled();
    });

    it('should handle deletion when tblDatos is missing', async () => {
      const { component } = await createComponent();
      // Remove table
      const tblDatos = component.querySelector('#tbl-datos-incidencias');
      tblDatos.remove();
      
      ModalService.confirm.mockResolvedValueOnce(true);
      IncidenciaService.delete.mockResolvedValueOnce();
      
      await component.eliminarIncidencia(102);
      
      expect(IncidenciaService.delete).toHaveBeenCalledWith(102);
      expect(ToastService.success).toHaveBeenCalled();
      // Should not throw error
    });
  });
});
