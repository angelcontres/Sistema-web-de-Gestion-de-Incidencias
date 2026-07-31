import { jest, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { UserIndexComponent } from './user-index.component.js';
import { UserService } from '../../services/user.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';

function getConfigureColumns() {
  const configureCalls = HTMLDivElement.prototype.configure.mock.calls;
  return configureCalls[configureCalls.length - 1][0].columns;
}

describe('UserIndexComponent', () => {
  let component;

  beforeAll(() => {
    HTMLDivElement.prototype.configure = jest.fn();
    HTMLDivElement.prototype.load = jest.fn().mockResolvedValue([]);
  });

  afterAll(() => {
    delete HTMLDivElement.prototype.configure;
    delete HTMLDivElement.prototype.load;
  });

  beforeEach(() => {
    const templateHtml = `
      <button id="btn-nuevo-registro"></button>
      <div id="tbl-datos-usuarios"></div>
    `;
    window.fetch = jest.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve(templateHtml) }));

    document.body.innerHTML = `
      <app-toast></app-toast>
      <app-user-index></app-user-index>
    `;
    
    component = document.querySelector('app-user-index');

    jest.spyOn(AuthService, 'hasPermission').mockReturnValue(true);
    
    jest.spyOn(UserService, 'getAll').mockResolvedValue([]);
    jest.spyOn(UserService, 'delete').mockResolvedValue({});
    
    jest.spyOn(ToastService, 'success').mockImplementation(() => {});
    jest.spyOn(ToastService, 'error').mockImplementation(() => {});
    jest.spyOn(ModalService, 'confirm').mockResolvedValue(true);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    delete window.fetch;
  });

  it('debería inicializar la tabla de usuarios', async () => {
    await component.onInit();
    
    const tblDatos = component.querySelector('#tbl-datos-usuarios');
    expect(tblDatos.configure).toHaveBeenCalled();
    expect(tblDatos.load).toHaveBeenCalled();
  });

  it('debería ocultar botón nuevo si no tiene permisos', async () => {
    AuthService.hasPermission.mockReturnValue(false);
    await component.onInit();
    
    const btnNuevo = component.querySelector('#btn-nuevo-registro');
    expect(btnNuevo.classList.contains('d-none')).toBe(true);
  });

  it('eliminarUsuario debería mostrar modal y llamar delete', async () => {
    await component.onInit();
    await component.eliminarUsuario(1, 'Admin');
    
    expect(ModalService.confirm).toHaveBeenCalled();
    expect(UserService.delete).toHaveBeenCalledWith(1);
    expect(ToastService.success).toHaveBeenCalled();
  });

  it('debería renderizar columnas con funciones correctas', async () => {
    await component.onInit();

    const columns = getConfigureColumns();

    const idCol = columns.find(c => c.header === 'ID');
    expect(idCol.format(42)).toBe('#42');

    const nombreCol = columns.find(c => c.header === 'Nombre');
    expect(nombreCol.render({ name: 'Carlos' })).toBe('Carlos');
    expect(nombreCol.render({ name: null })).toContain('Sin nombre');

    const rolesCol = columns.find(c => c.header === 'Roles');
    expect(rolesCol.render({ roles: null })).toBe('-');
    expect(rolesCol.render({ roles: [] })).toBe('-');
    const rolesRendered = rolesCol.render({ roles: [{ nombre: 'Admin' }, { nombre: 'User' }] });
    expect(rolesRendered).toContain('Admin');
    expect(rolesRendered).toContain('User');

    const estadoCol = columns.find(c => c.header === 'Estado');
    expect(estadoCol.render({ email_verified_at: null })).toContain('Pendiente');
    expect(estadoCol.render({ email_verified_at: '2024-01-01', activo: true })).toContain('Activo');
    expect(estadoCol.render({ email_verified_at: '2024-01-01', activo: false })).toContain('Inactivo');

    const creadoCol = columns.find(c => c.header === 'Creado el');
    expect(creadoCol.render({ created_at: null })).toBe('-');
    expect(creadoCol.render({ created_at: '2024-06-15T10:30:00Z' })).toContain('2024');
  });

  it('debería navegar a editar en row-action editar', async () => {
    await component.onInit();

    const tblDatos = component.querySelector('#tbl-datos-usuarios');
    window.location.hash = '';
    tblDatos.dispatchEvent(new CustomEvent('row-action', { detail: { action: 'editar', item: { id: 5 } } }));

    expect(window.location.hash).toBe('#/usuarios/form?id=5');
  });

  it('debería llamar eliminarUsuario en row-action eliminar', async () => {
    await component.onInit();

    const eliminarSpy = jest.spyOn(component, 'eliminarUsuario').mockResolvedValue(undefined);

    const tblDatos = component.querySelector('#tbl-datos-usuarios');
    tblDatos.dispatchEvent(new CustomEvent('row-action', { detail: { action: 'eliminar', item: { id: 10, name: 'TestUser' } } }));

    expect(eliminarSpy).toHaveBeenCalledWith(10, 'TestUser');
  });

  it('debería usar username como fallback en row-action eliminar', async () => {
    await component.onInit();

    const eliminarSpy = jest.spyOn(component, 'eliminarUsuario').mockResolvedValue(undefined);

    const tblDatos = component.querySelector('#tbl-datos-usuarios');
    tblDatos.dispatchEvent(new CustomEvent('row-action', { detail: { action: 'eliminar', item: { id: 10, username: 'jdoe' } } }));

    expect(eliminarSpy).toHaveBeenCalledWith(10, 'jdoe');
  });

  it('debería mostrar toast de error cuando eliminarUsuario falla', async () => {
    const error = new Error('Network error');
    UserService.delete.mockRejectedValue(error);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await component.onInit();
    await component.eliminarUsuario(1, 'Admin');

    expect(ToastService.error).toHaveBeenCalledWith('Error al eliminar: Network error');
  });

  it('no debería incluir editar cuando UPDATE no está permitido', async () => {
    AuthService.hasPermission.mockImplementation((perm) => perm !== 'UPDATE');
    await component.onInit();

    const columns = getConfigureColumns();
    const accionesCol = columns.find(c => c.header === 'Acciones');

    expect(accionesCol.actions.find(a => a.name === 'editar')).toBeUndefined();
    expect(accionesCol.actions.find(a => a.name === 'eliminar')).toBeDefined();
  });

  it('no debería incluir eliminar cuando DELETE no está permitido', async () => {
    AuthService.hasPermission.mockImplementation((perm) => perm !== 'DELETE');
    await component.onInit();

    const columns = getConfigureColumns();
    const accionesCol = columns.find(c => c.header === 'Acciones');

    expect(accionesCol.actions.find(a => a.name === 'eliminar')).toBeUndefined();
    expect(accionesCol.actions.find(a => a.name === 'editar')).toBeDefined();
  });

  it('no debería incluir acciones cuando ambos permisos están denegados', async () => {
    AuthService.hasPermission.mockReturnValue(false);
    await component.onInit();

    const columns = getConfigureColumns();
    const accionesCol = columns.find(c => c.header === 'Acciones');

    expect(accionesCol.actions).toHaveLength(0);
  });
});
