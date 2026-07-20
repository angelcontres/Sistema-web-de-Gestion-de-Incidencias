import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UserFormComponent } from './user-form.component.js';
import { UserService } from '../../services/user.service.js';
import { RoleService } from '../../../role/services/role.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { InstitucionService } from '../../../instituciones/services/institucion.service.js';
import { CatalogoService } from '../../../../shared/services/catalogo.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

describe('UserFormComponent', () => {
  let component;

  beforeEach(() => {
    const templateHtml = `
      <form id="userForm">
        <input id="userId" value="" />
        <input id="username" value="" />
        <input id="name" value="" />
        <input id="email" value="" />
        <input id="password" value="" />
        <input type="checkbox" id="activo" />
        
        <div id="institucionContainer" class="d-none">
          <select id="institucion_id"></select>
        </div>
        
        <div id="territorioContainer" class="d-none">
          <select id="territorios_select"></select>
        </div>
        
        <div id="rolesDisponiblesList"></div>
        <div id="rolesAsignadosList"></div>
        
        <h5 id="userModalLabel"></h5>
        <span id="btnText"></span>
        <span id="txtPasswordHelp"></span>
        
        <div id="modalErrorAlert" class="d-none"></div>
        <span id="modalErrorMessage"></span>
        
        <div id="loadingSpinner" class="d-none"></div>
        <button id="btnSubmit" type="submit"></button>
      </form>
    `;
    window.fetch = jest.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve(templateHtml) }));

    document.body.innerHTML = `
      <app-user-form></app-user-form>
    `;
    
    component = document.querySelector('app-user-form');

    jest.spyOn(AuthService, 'hasPermission').mockReturnValue(true);
    jest.spyOn(AuthService, 'getPaisId').mockReturnValue(1);
    
    jest.spyOn(UserService, 'getById').mockResolvedValue({
      id: 5,
      username: 'test',
      name: 'Test',
      activo: true,
      roles: [{ id: 1, nombre: 'Admin' }],
      institucion_id: 1,
      territorios: [{ id: 1 }]
    });
    jest.spyOn(UserService, 'create').mockResolvedValue({});
    jest.spyOn(UserService, 'update').mockResolvedValue({});
    
    jest.spyOn(RoleService, 'getAll').mockResolvedValue([
      { id: 1, nombre: 'Admin' },
      { id: 2, nombre: 'Institucion' },
      { id: 3, nombre: 'Supervisor' }
    ]);
    
    jest.spyOn(InstitucionService, 'getAll').mockResolvedValue([
      { id: 1, nombre: 'Inst 1' }
    ]);

    jest.spyOn(CatalogoService, 'getTerritorios').mockResolvedValue([
      { id: 1, nombre: 'Territorio 1' }
    ]);
    
    // Set default hash
    window.location.hash = '#/usuarios/form';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    delete window.fetch;
  });

  it('debería inicializar en modo creación si no hay ID en hash', async () => {
    window.location.hash = '#/usuarios/form';
    await component.onInit();
    
    expect(component.querySelector('#userModalLabel').textContent).toBe('Crear Nuevo Usuario');
    expect(InstitucionService.getAll).toHaveBeenCalled();
    expect(CatalogoService.getTerritorios).toHaveBeenCalled();
    expect(RoleService.getAll).toHaveBeenCalled();
  });

  it('debería cargar datos en modo edición al llamar cargarDatosEdicion', async () => {
    await component.onInit();
    await new Promise(resolve => setTimeout(resolve, 50)); // Wait for internal init()
    
    await component.cargarDatosEdicion('5');
    
    expect(UserService.getById).toHaveBeenCalledWith('5');
    expect(component.querySelector('#username').value).toBe('test');
  });

  it('checkInstitucionRole debería mostrar select de institucion si el rol Institucion está asignado', async () => {
    await component.onInit();
    
    // Mock Assigned Role
    component.rolesAsignadosList.innerHTML = '<div class="role-draggable-item" data-role-name="Institucion"></div>';
    
    component.checkInstitucionRole();
    
    expect(component.institucionContainer.classList.contains('d-none')).toBe(false);
  });

  it('checkInstitucionRole debería mostrar select de territorios si el rol Supervisor está asignado', async () => {
    await component.onInit();
    
    component.rolesAsignadosList.innerHTML = '<div class="role-draggable-item" data-role-name="Supervisor"></div>';
    
    component.checkInstitucionRole();
    
    expect(component.territorioContainer.classList.contains('d-none')).toBe(false);
  });

  it('guardarUsuario debería llamar create en modo nuevo', async () => {
    window.location.hash = '#/usuarios/form';
    await component.onInit();
    
    const form = component.querySelector('#userForm');
    form.checkValidity = jest.fn().mockReturnValue(true);
    
    component.querySelector('#username').value = 'newuser';
    component.querySelector('#password').value = '123';
    
    await component.guardarUsuario({ preventDefault: jest.fn() });
    
    expect(UserService.create).toHaveBeenCalled();
  });

  it('guardarUsuario debería llamar update en modo edición', async () => {
    jest.spyOn(URLSearchParams.prototype, 'get').mockReturnValue('5');
    await component.onInit();
    
    component.userIdInput.value = '5';
    const form = component.querySelector('#userForm');
    form.checkValidity = jest.fn().mockReturnValue(true);
    
    await component.guardarUsuario({ preventDefault: jest.fn() });
    
    expect(UserService.update).toHaveBeenCalled();
  });
});
