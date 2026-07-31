import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import './user-form.component.js';
import { UserService } from '../../services/user.service.js';
import { RoleService } from '../../../role/services/role.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { InstitucionService } from '../../../instituciones/services/institucion.service.js';
import { CatalogoService } from '../../../../shared/services/catalogo.service.js';

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
    window.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(templateHtml) })
    );

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
      territorios: [{ id: 1 }],
    });
    jest.spyOn(UserService, 'create').mockResolvedValue({});
    jest.spyOn(UserService, 'update').mockResolvedValue({});

    jest.spyOn(RoleService, 'getAll').mockResolvedValue([
      { id: 1, nombre: 'Admin' },
      { id: 2, nombre: 'Institucion' },
      { id: 3, nombre: 'Supervisor' },
    ]);

    jest.spyOn(InstitucionService, 'getAll').mockResolvedValue([{ id: 1, nombre: 'Inst 1' }]);

    jest
      .spyOn(CatalogoService, 'getTerritorios')
      .mockResolvedValue([{ id: 1, nombre: 'Territorio 1' }]);

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

    expect(component.querySelector('#userModalLabel').textContent).toBe('Invitar Usuario');
    expect(InstitucionService.getAll).toHaveBeenCalled();
    expect(CatalogoService.getTerritorios).toHaveBeenCalled();
    expect(RoleService.getAll).toHaveBeenCalled();
  });

  it('debería cargar datos en modo edición al llamar cargarDatosEdicion', async () => {
    await component.onInit();
    await new Promise((resolve) => setTimeout(resolve, 50)); // Wait for internal init()

    await component.cargarDatosEdicion('5');

    expect(UserService.getById).toHaveBeenCalledWith('5');
    expect(component.querySelector('#username').value).toBe('test');
  });

  it('checkInstitucionRole debería mostrar select de institucion si el rol Institucion está asignado', async () => {
    await component.onInit();

    // Mock Assigned Role
    component.rolesAsignadosList.innerHTML =
      '<div class="role-draggable-item" data-role-name="Institucion"></div>';

    component.checkInstitucionRole();

    expect(component.institucionContainer.classList.contains('d-none')).toBe(false);
  });

  it('checkInstitucionRole debería mostrar select de territorios si el rol Supervisor está asignado', async () => {
    await component.onInit();

    component.rolesAsignadosList.innerHTML =
      '<div class="role-draggable-item" data-role-name="Supervisor"></div>';

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

  it('debería manejar eventos de drag and drop entre listas de roles', async () => {
    await component.onInit();
    const dispList = component.rolesDisponiblesList;
    const asigList = component.rolesAsignadosList;

    dispList.innerHTML = '<div class="role-draggable-item" data-role-id="10">Role 10</div>';

    dispList.dispatchEvent(new Event('dragover'));
    expect(dispList.classList.contains('bg-opacity-75')).toBe(true);
    dispList.dispatchEvent(new Event('dragleave'));
    expect(dispList.classList.contains('bg-opacity-75')).toBe(false);

    const dropEvent = new Event('drop');
    dropEvent.dataTransfer = {
      getData: jest.fn().mockReturnValue('10'),
    };
    asigList.dispatchEvent(dropEvent);
    expect(asigList.querySelector('[data-role-id="10"]')).not.toBeNull();
  });

  it('debería configurar la interfaz correctamente para edición y creación', async () => {
    await component.onInit();
    component.configurarModoEdicion();
    expect(component.formTitle.textContent).toBe('Editar Usuario');
    expect(component.btnText.textContent).toBe('Actualizar Usuario');
    expect(component.passwordInput.required).toBe(false);

    component.configurarModoCreacion();
    expect(component.formTitle.textContent).toBe('Invitar Usuario');
    expect(component.btnText.textContent).toBe('Enviar Invitación');
    expect(component.passwordInput.required).toBe(false);
  });

  it('debería manejar errores en cargarDatosEdicion al fallar el servicio', async () => {
    await component.onInit();
    jest.spyOn(UserService, 'getById').mockRejectedValue(new Error('Error de red'));
    component.mostrarError = jest.fn();
    component.btnSubmit = document.createElement('button');

    await component.cargarDatosEdicion('999');

    expect(component.mostrarError).toHaveBeenCalledWith('No se pudieron cargar los datos del usuario.');
    expect(component.btnSubmit.disabled).toBe(true);
  });

  it('debería bloquear acceso si no tiene permiso CREATE', async () => {
    AuthService.hasPermission.mockReturnValue(false);
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    await component.onInit();

    expect(alertSpy).toHaveBeenCalledWith('No tienes permiso para crear usuarios.');
    expect(window.location.hash).toBe('#/usuarios');
  });

  it('guardarUsuario debería retornar si formulario no es válido', async () => {
    await component.onInit();
    const form = component.querySelector('#userForm');
    form.checkValidity = jest.fn().mockReturnValue(false);

    await component.guardarUsuario({ preventDefault: jest.fn() });

    expect(form.classList.contains('was-validated')).toBe(true);
    expect(UserService.create).not.toHaveBeenCalled();
    expect(UserService.update).not.toHaveBeenCalled();
  });

  it('debería manejar error en cargarRolesCheckboxes', async () => {
    await component.onInit();
    RoleService.getAll.mockRejectedValue(new Error('Error de red'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await component.cargarRolesCheckboxes();

    expect(consoleSpy).toHaveBeenCalledWith('Error al cargar catálogo de roles:', expect.any(Error));
    expect(component.rolesDisponiblesList.innerHTML).toContain('Error al cargar roles.');
  });

  it('debería manejar error en cargarInstituciones', async () => {
    InstitucionService.getAll.mockRejectedValue(new Error('Error de red'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await component.onInit();

    expect(consoleSpy).toHaveBeenCalledWith('Error al cargar instituciones:', expect.any(Error));
  });

  it('debería manejar error en cargarTerritorios', async () => {
    CatalogoService.getTerritorios.mockRejectedValue(new Error('Error de red'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await component.onInit();

    expect(consoleSpy).toHaveBeenCalledWith('Error al cargar territorios:', expect.any(Error));
  });

  it('guardarUsuario debería manejar error al guardar en modo creación', async () => {
    window.location.hash = '#/usuarios/form';
    await component.onInit();

    component.errorAlert.scrollIntoView = jest.fn();

    const form = component.querySelector('#userForm');
    form.checkValidity = jest.fn().mockReturnValue(true);
    component.querySelector('#username').value = 'newuser';
    component.querySelector('#password').value = '123';
    UserService.create.mockRejectedValue(new Error('Error del servidor'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await component.guardarUsuario({ preventDefault: jest.fn() });

    expect(consoleSpy).toHaveBeenCalledWith('Error al guardar usuario:', expect.any(Error));
    expect(component.errorAlert.classList.contains('d-none')).toBe(false);
    expect(component.loadingSpinner.classList.contains('d-none')).toBe(true);
  });

  it('debería manejar eventos dragstart y dragend en items de roles', async () => {
    await component.onInit();
    const item = component.rolesDisponiblesList.querySelector('.role-draggable-item');

    const dragStartEvent = new Event('dragstart');
    dragStartEvent.dataTransfer = { setData: jest.fn() };
    item.dispatchEvent(dragStartEvent);
    expect(item.style.opacity).toBe('0.5');

    item.dispatchEvent(new Event('dragend'));
    expect(item.style.opacity).toBe('1');
  });

  it('toggleLoading debería manejar ambos estados', async () => {
    await component.onInit();
    expect(component.loadingSpinner.classList.contains('d-none')).toBe(true);

    component.toggleLoading(true);
    expect(component.btnSubmit.disabled).toBe(true);
    expect(component.loadingSpinner.classList.contains('d-none')).toBe(false);

    component.toggleLoading(false);
    expect(component.btnSubmit.disabled).toBe(false);
    expect(component.loadingSpinner.classList.contains('d-none')).toBe(true);
  });

  it('mostrarError debería mostrar mensaje de error con scrollIntoView', async () => {
    await component.onInit();
    const scrollSpy = jest.fn();
    component.errorAlert.scrollIntoView = scrollSpy;

    component.mostrarError('Error de prueba');

    expect(component.errorMessage.textContent).toBe('Error de prueba');
    expect(component.errorAlert.classList.contains('d-none')).toBe(false);
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
  });

  it('limpiarErrores debería ocultar la alerta de error', async () => {
    await component.onInit();
    component.errorAlert.classList.remove('d-none');

    component.limpiarErrores();

    expect(component.errorAlert.classList.contains('d-none')).toBe(true);
  });

  it('updateEmptyStates debería remover empty indicators si hay items en las listas', async () => {
    await component.onInit();

    component.rolesDisponiblesList.innerHTML = '';
    component.rolesAsignadosList.innerHTML = '';

    const dispItem = document.createElement('div');
    dispItem.dataset.roleId = '98';
    component.rolesDisponiblesList.appendChild(dispItem);

    const dispIndicator = document.createElement('span');
    dispIndicator.className = 'empty-indicator';
    component.rolesDisponiblesList.appendChild(dispIndicator);

    const asigItem = document.createElement('div');
    asigItem.dataset.roleId = '99';
    component.rolesAsignadosList.appendChild(asigItem);

    const asigIndicator = document.createElement('span');
    asigIndicator.className = 'empty-indicator';
    component.rolesAsignadosList.appendChild(asigIndicator);

    component.updateEmptyStates();

    expect(component.rolesDisponiblesList.querySelector('.empty-indicator')).toBeNull();
    expect(component.rolesAsignadosList.querySelector('.empty-indicator')).toBeNull();
  });

  it('cargarRolesCheckboxes debería mostrar mensaje si no hay roles', async () => {
    await component.onInit();
    RoleService.getAll.mockResolvedValue([]);

    await component.cargarRolesCheckboxes();

    expect(component.rolesDisponiblesList.querySelector('.empty-indicator')).not.toBeNull();
    expect(component.rolesAsignadosList.querySelector('.empty-indicator')).not.toBeNull();
  });

  it('guardarUsuario debería incluir territorios seleccionados en payload cuando contenedor visible', async () => {
    window.location.hash = '#/usuarios/form';
    await component.onInit();

    component.territorioContainer.classList.remove('d-none');
    if (component.territoriosSelect.options.length > 0) {
      component.territoriosSelect.options[0].selected = true;
    }

    const form = component.querySelector('#userForm');
    form.checkValidity = jest.fn().mockReturnValue(true);
    component.querySelector('#username').value = 'newuser';

    await component.guardarUsuario({ preventDefault: jest.fn() });

    expect(UserService.create).toHaveBeenCalledWith(expect.objectContaining({
      territorios: [1],
    }));
  });
});

