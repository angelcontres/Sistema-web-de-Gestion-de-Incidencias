import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { RoleIndexComponent } from './role-index.component.js';
import { RoleService } from '../../services/role.service.js';
import { PermissionService } from '../../../permissions/services/permissions.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { AuthService } from '../../../../core/auth.service.js';

describe('RoleIndexComponent', () => {
  beforeEach(() => {
    // Mock the HTML fetch for BaseComponent
    window.fetch = jest.fn((url) => {
      if (url.includes('.html')) {
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(`
            <div>
              <div id="loadingSpinner"></div>
              <div id="rolesGrid"></div>
              <div id="emptyState"></div>
              <span id="totalRolesBadge"></span>
              <button id="btnNuevoRol"></button>
              <div id="app-role-form"></div>
              <form id="roleForm">
                <input id="roleId" />
                <input id="nombre" />
                <input id="descripcion" />
                <select id="padre_id"></select>
                <div id="roleModalLabel"></div>
                <div id="btnText"></div>
              </form>
              <form id="assignPermissionsForm"></form>
              <div id="permissionsAccordionContainer"></div>
              <button id="btnClosePermissions"></button>
              <input id="assignRoleId" />
              <span id="activeRoleName"></span>
              <div id="accordionMenus"></div>
              <button id="btnAssignSubmit"></button>
            </div>
          `),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    window.dispatchEvent = jest.fn();

    global.bootstrap = {
      Modal: {
        getOrCreateInstance: jest.fn(() => ({
          show: jest.fn(),
          hide: jest.fn(),
        })),
      },
    };
    window.bootstrap = global.bootstrap;
    window.scrollTo = jest.fn();
    window.alert = jest.fn();

    jest.spyOn(AuthService, 'hasPermission').mockReturnValue(true);
    jest.spyOn(RoleService, 'getAll').mockResolvedValue([]);
    jest.spyOn(RoleService, 'delete').mockResolvedValue({});
    jest.spyOn(RoleService, 'getById').mockResolvedValue({ permisos: [] });
    jest.spyOn(RoleService, 'assignPermissions').mockResolvedValue({});
    jest.spyOn(PermissionService, 'getAll').mockResolvedValue([]);
    jest.spyOn(ToastService, 'success').mockImplementation(() => {});
    jest.spyOn(ToastService, 'error').mockImplementation(() => {});
    jest.spyOn(ModalService, 'confirm').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  async function createComponent() {
    document.body.innerHTML = '<app-role-index></app-role-index>';
    const component = document.querySelector('app-role-index');

    if (component.onInit) await component.onInit();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    return component;
  }

  it('should initialize and load roles (empty list)', async () => {
    RoleService.getAll.mockResolvedValue([]);
    const component = await createComponent();
    expect(RoleService.getAll).toHaveBeenCalled();
    const emptyState = component.querySelector('#emptyState');
    expect(emptyState.classList.contains('d-none')).toBe(false);
  });

  it('should load roles and render grid', async () => {
    RoleService.getAll.mockResolvedValue([
      { id: 1, nombre: 'Admin', descripcion: 'Administrator' },
    ]);
    const component = await createComponent();
    const rolesGrid = component.querySelector('#rolesGrid');
    expect(rolesGrid.innerHTML).toContain('Admin');

    const cardEl = component.querySelector('.role-card');
    expect(cardEl).toBeTruthy();

    // Simulate hover
    cardEl.dispatchEvent(new Event('mouseover'));
    expect(cardEl.classList.contains('shadow')).toBe(true);
    cardEl.dispatchEvent(new Event('mouseout'));
    expect(cardEl.classList.contains('shadow')).toBe(false);
  });

  it('should handle btnNuevoRol click and permissions', async () => {
    RoleService.getAll.mockResolvedValue([]);
    const component = await createComponent();
    const btnNuevoRol = component.querySelector('#btnNuevoRol');
    const formComponent = component.querySelector('#app-role-form');
    formComponent.abrirModalCrear = jest.fn();

    btnNuevoRol.dispatchEvent(new Event('click'));
    expect(formComponent.abrirModalCrear).toHaveBeenCalled();
  });

  it('should hide btnNuevoRol if no CREATE permission', async () => {
    AuthService.hasPermission.mockImplementation((action) => action !== 'CREATE');
    const component = await createComponent();
    const btnNuevoRol = component.querySelector('#btnNuevoRol');
    expect(btnNuevoRol.classList.contains('d-none')).toBe(true);
  });

  it('should handle rol-guardado event', async () => {
    const component = await createComponent();
    const formComponent = component.querySelector('#app-role-form');

    jest.clearAllMocks();

    const event = new CustomEvent('rol-guardado', { detail: { mensaje: 'Exito' } });
    formComponent.dispatchEvent(event);

    expect(ToastService.success).toHaveBeenCalledWith('Exito');
    expect(RoleService.getAll).toHaveBeenCalled();
  });

  it('should handle error in cargarRoles', async () => {
    RoleService.getAll.mockRejectedValue(new Error('Network error'));
    const component = await createComponent();
    expect(ToastService.error).toHaveBeenCalledWith(expect.stringContaining('Network error'));
  });

  it('should allow editing a role', async () => {
    RoleService.getAll.mockResolvedValue([{ id: 1, nombre: 'Role 1' }]);
    const component = await createComponent();
    const btnEdit = component.querySelector('[data-action="editar"]');
    const formComponent = component.querySelector('#app-role-form');
    formComponent.abrirModalEditar = jest.fn();

    btnEdit.dispatchEvent(new Event('click'));
    expect(formComponent.abrirModalEditar).toHaveBeenCalled();
  });

  it('should delete a role', async () => {
    RoleService.getAll.mockResolvedValue([{ id: 1, nombre: 'Role 1' }]);
    const component = await createComponent();
    const btnDelete = component.querySelector('[data-action="eliminar"]');

    jest.clearAllMocks();

    btnDelete.dispatchEvent(new Event('click'));
    await Promise.resolve();
    await Promise.resolve();

    expect(ModalService.confirm).toHaveBeenCalled();
    expect(RoleService.delete).toHaveBeenCalledWith(1);
    expect(ToastService.success).toHaveBeenCalledWith(expect.stringContaining('Role 1'));
    expect(RoleService.getAll).toHaveBeenCalled();
  });

  it('should handle error when deleting role', async () => {
    RoleService.delete.mockRejectedValue(new Error('Delete error'));
    RoleService.getAll.mockResolvedValue([{ id: 1, nombre: 'Role 1' }]);
    const component = await createComponent();
    const btnDelete = component.querySelector('[data-action="eliminar"]');

    btnDelete.dispatchEvent(new Event('click'));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(ToastService.error).toHaveBeenCalledWith(expect.stringContaining('Delete error'));
  });

  it('should open permissions panel', async () => {
    RoleService.getAll.mockResolvedValue([{ id: 1, nombre: 'Role 1' }]);
    PermissionService.getAll.mockResolvedValue([
      { id: 10, nombre: 'Crear Usuario', opcion_menu: { nombre: 'Usuarios' } },
      { id: 11, nombre: 'Editar Usuario', opcion_menu: null, opcionMenu: { nombre: 'Usuarios' } },
      { id: 12, nombre: 'Otro', accion: 'CREATE', recurso: 'recurso' },
    ]);
    RoleService.getById.mockResolvedValue({ permisos: [{ id: 10 }] });

    const component = await createComponent();
    const cardEl = component.querySelector('.role-card');
    cardEl.dispatchEvent(new Event('click'));

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const accordionContainer = component.querySelector('#permissionsAccordionContainer');
    expect(accordionContainer.classList.contains('d-none')).toBe(false);
    expect(component.querySelector('#activeRoleName').textContent).toBe('Role 1');
    expect(component.querySelector('#assignRoleId').value).toBe('1');

    // interact with select-all
    const selectAllCheckbox = component.querySelector('.select-all-menu');
    expect(selectAllCheckbox).toBeTruthy();

    // Stop propagation test
    const mockEvent = { stopPropagation: jest.fn() };
    selectAllCheckbox.dispatchEvent(new Event('click', mockEvent));

    // Check all checkboxes in menu
    selectAllCheckbox.checked = true;
    selectAllCheckbox.dispatchEvent(new Event('change'));

    const individualCheckboxes = component.querySelectorAll('.permission-checkbox');
    expect(individualCheckboxes[0].checked).toBe(true);

    // Uncheck one to test indeterminate
    individualCheckboxes[0].checked = false;
    individualCheckboxes[0].dispatchEvent(new Event('change'));
    expect(selectAllCheckbox.indeterminate).toBe(true);
  });

  it('should handle close permissions panel', async () => {
    const component = await createComponent();
    const btnClosePermissions = component.querySelector('#btnClosePermissions');
    const e = new Event('click', { bubbles: true, cancelable: true });
    btnClosePermissions.dispatchEvent(e);
    expect(
      component.querySelector('#permissionsAccordionContainer').classList.contains('d-none')
    ).toBe(true);
  });

  it('should submit permissions form', async () => {
    RoleService.getAll.mockResolvedValue([{ id: 1, nombre: 'Role 1' }]);
    PermissionService.getAll.mockResolvedValue([{ id: 10, nombre: 'Crear Usuario' }]);
    const component = await createComponent();

    // Open panel
    const cardEl = component.querySelector('.role-card');
    cardEl.dispatchEvent(new Event('click'));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // Check a checkbox
    const checkbox = component.querySelector('.permission-checkbox');
    checkbox.checked = true;

    const assignForm = component.querySelector('#assignPermissionsForm');
    const mockSubmit = new Event('submit', { cancelable: true });
    assignForm.dispatchEvent(mockSubmit);

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(RoleService.assignPermissions).toHaveBeenCalledWith('1', { permisos: [10] });
    expect(ToastService.success).toHaveBeenCalledWith('Permisos asignados correctamente.');
  });

  it('should handle permissions save error', async () => {
    RoleService.getAll.mockResolvedValue([{ id: 1, nombre: 'Role 1' }]);
    PermissionService.getAll.mockResolvedValue([{ id: 10, nombre: 'Crear Usuario' }]);
    RoleService.assignPermissions.mockRejectedValue(new Error('Save failed'));

    const component = await createComponent();

    // Open panel
    const cardEl = component.querySelector('.role-card');
    cardEl.dispatchEvent(new Event('click'));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const assignForm = component.querySelector('#assignPermissionsForm');
    assignForm.dispatchEvent(new Event('submit', { cancelable: true }));

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Save failed'));
  });

  it('should handle error when loading permissions', async () => {
    RoleService.getAll.mockResolvedValue([{ id: 1, nombre: 'Role 1' }]);
    PermissionService.getAll.mockRejectedValue(new Error('Fetch failed'));

    const component = await createComponent();
    const cardEl = component.querySelector('.role-card');
    cardEl.dispatchEvent(new Event('click'));

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    const accordionMenus = component.querySelector('#accordionMenus');
    expect(accordionMenus.innerHTML).toContain('Error al cargar la lista de permisos');
  });

  it('should show no permissions message if empty array returned', async () => {
    RoleService.getAll.mockResolvedValue([{ id: 1, nombre: 'Role 1' }]);
    PermissionService.getAll.mockResolvedValue([]); // Empty

    const component = await createComponent();
    const cardEl = component.querySelector('.role-card');
    cardEl.dispatchEvent(new Event('click'));

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    const accordionMenus = component.querySelector('#accordionMenus');
    expect(accordionMenus.innerHTML).toContain('No hay permisos registrados');
  });

  it('should populate padre_id select with role options', async () => {
    const component = await createComponent();
    const roles = [
      { id: 1, nombre: 'Admin' },
      { id: 2, nombre: 'User' },
    ];
    component.llenarSelectPadre(roles);

    const selectPadre = component.querySelector('#padre_id');
    const options = selectPadre.querySelectorAll('option');
    expect(options).toHaveLength(3);
    expect(options[1].value).toBe('1');
    expect(options[1].textContent).toBe('Admin');
    expect(options[2].value).toBe('2');
    expect(options[2].textContent).toBe('User');
  });

  it('should exclude a role from padre_id select when excluirId provided', async () => {
    const component = await createComponent();
    component.llenarSelectPadre(
      [
        { id: 1, nombre: 'Admin' },
        { id: 2, nombre: 'User' },
      ],
      1
    );

    const options = component.querySelectorAll('#padre_id option');
    expect(options).toHaveLength(2);
    expect(options[1].value).toBe('2');
  });

  it('should set selected value on padre_id select', async () => {
    const component = await createComponent();
    component.llenarSelectPadre(
      [
        { id: 1, nombre: 'Admin' },
        { id: 2, nombre: 'User' },
      ],
      null,
      '2'
    );

    const selectPadre = component.querySelector('#padre_id');
    expect(selectPadre.value).toBe('2');
  });

  it('should do nothing if padre_id select does not exist', async () => {
    const component = await createComponent();
    component.querySelector('#padre_id').remove();
    expect(() => component.llenarSelectPadre([{ id: 1, nombre: 'Admin' }])).not.toThrow();
  });

  it('should call abrirModalEditar on formComponent', async () => {
    const roles = [{ id: 1, nombre: 'Admin' }];
    RoleService.getAll.mockResolvedValue(roles);
    const component = await createComponent();
    const formComponent = component.querySelector('#app-role-form');
    formComponent.abrirModalEditar = jest.fn();

    component.abrirModalEditar(roles[0], roles);
    expect(formComponent.abrirModalEditar).toHaveBeenCalledWith(roles[0], roles);
  });

  it('should hide modal error alert on limpiarErroresModal', async () => {
    const component = await createComponent();
    const modalErrorAlert = document.createElement('div');
    modalErrorAlert.id = 'modalErrorAlert';
    component.appendChild(modalErrorAlert);

    expect(modalErrorAlert.classList.contains('d-none')).toBe(false);
    component.limpiarErroresModal();
    expect(modalErrorAlert.classList.contains('d-none')).toBe(true);
  });

  it('should do nothing on limpiarErroresModal if modalErrorAlert does not exist', async () => {
    const component = await createComponent();
    expect(() => component.limpiarErroresModal()).not.toThrow();
  });
});
