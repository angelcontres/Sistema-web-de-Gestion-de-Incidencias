import { jest, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { UserIndexComponent } from './user-index.component.js';
import { UserService } from '../../services/user.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';

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
});
