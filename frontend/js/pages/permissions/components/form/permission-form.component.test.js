import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PermissionFormComponent } from './permission-form.component.js';
import { PermissionService } from '../../services/permissions.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

const TEMPLATE_HTML = `<div class="modal fade" id="permisoModal" tabindex="-1" aria-labelledby="permisoModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content premium-modal-content shadow-lg">
      <div class="modal-header bg-white border-0 pt-4 px-4 pb-2">
        <h5 class="modal-title fw-bold text-dark" id="permisoModalLabel">Nuevo Permiso</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body px-4 pb-4">
        <div id="modalErrorAlert" class="alert alert-danger d-none py-2 px-3 small mb-3">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <span id="modalErrorMessage">Hubo un error al guardar el permiso.</span>
        </div>
        <div id="loadingSpinner" class="d-none text-center py-4">
          <output class="spinner-border text-primary">
            <span class="visually-hidden">Cargando...</span>
          </output>
        </div>
        <form id="permisoForm" novalidate>
          <input type="hidden" id="permisoId" />
          <div class="mb-3">
            <label for="nombre" class="form-label fw-semibold text-dark">Nombre del Permiso</label>
            <input type="text" class="form-control" id="nombre" required placeholder="Ej: crear usuario" />
            <div class="invalid-feedback">El nombre es obligatorio.</div>
          </div>
          <div class="mb-3">
            <label for="recurso" class="form-label fw-semibold text-dark">Recurso (Módulo)</label>
            <input type="text" class="form-control" id="recurso" required placeholder="Ej: usuarios, incidencias" />
            <div class="invalid-feedback">El recurso es obligatorio.</div>
          </div>
          <div class="mb-3">
            <label for="accion" class="form-label fw-semibold text-dark">Acci\u00f3n</label>
            <select class="form-select" id="accion" required>
              <option value="" disabled selected>Seleccione una acci\u00f3n...</option>
              <option value="READ">READ (Lectura)</option>
              <option value="CREATE">CREATE (Creaci\u00f3n)</option>
              <option value="UPDATE">UPDATE (Actualizaci\u00f3n)</option>
              <option value="DELETE">DELETE (Eliminaci\u00f3n)</option>
            </select>
            <div class="invalid-feedback">Debe seleccionar una acci\u00f3n.</div>
          </div>
          <div class="mb-4">
            <label for="opcion_menu_id" class="form-label fw-semibold text-dark">Opci\u00f3n de Men\u00fa Asociada</label>
            <select class="form-select" id="opcion_menu_id">
              <option value="" disabled selected>Seleccione una opci\u00f3n...</option>
            </select>
            <div class="invalid-feedback">Debe seleccionar una opci\u00f3n de men\u00fa.</div>
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-light fw-semibold" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-primary fw-semibold px-4" id="btnSubmit">
              <span id="btnText">Guardar Permiso</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>`;

describe('PermissionFormComponent', () => {
  let consoleErrorSpy;
  let originalFetch;

  function createComponent() {
    const element = new PermissionFormComponent();
    element.innerHTML = TEMPLATE_HTML;
    return element;
  }

  beforeEach(() => {
    originalFetch = window.fetch;
    window.fetch = jest.fn((url) => {
      if (typeof url === 'string' && url.includes('/menu-options')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ id: 1, nombre: 'Menu1' }, { id: 2, nombre: 'Menu2' }]),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(TEMPLATE_HTML),
        json: () => Promise.resolve({}),
      });
    });

    PermissionService.create = jest.fn(() => Promise.resolve({}));
    PermissionService.update = jest.fn(() => Promise.resolve({}));

    ToastService.success = jest.fn();
    ToastService.error = jest.fn();

    global.bootstrap = {
      Modal: {
        getOrCreateInstance: jest.fn(() => ({ show: jest.fn(), hide: jest.fn() })),
        getInstance: jest.fn(() => ({ show: jest.fn(), hide: jest.fn() })),
      },
    };

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    window.fetch = originalFetch;
    delete global.bootstrap;
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('Component is defined as custom element', () => {
    expect(customElements.get('app-permission-form')).toBe(PermissionFormComponent);
  });

  it('onInit() - finds modal, appends to body, gets form references, sets up submit event', async () => {
    const component = createComponent();
    const modalEl = component.querySelector('#permisoModal');
    const form = component.querySelector('#permisoForm');
    const permisoId = component.querySelector('#permisoId');
    const nombre = component.querySelector('#nombre');
    const recurso = component.querySelector('#recurso');
    const accion = component.querySelector('#accion');
    const opcionMenu = component.querySelector('#opcion_menu_id');
    const formTitle = component.querySelector('#permisoModalLabel');
    const btnText = component.querySelector('#btnText');
    const btnSubmit = component.querySelector('#btnSubmit');
    const errorAlert = component.querySelector('#modalErrorAlert');
    const errorMessage = component.querySelector('#modalErrorMessage');
    const loadingSpinner = component.querySelector('#loadingSpinner');
    const addEventListenerSpy = jest.spyOn(form, 'addEventListener');
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');

    await component.onInit();

    expect(component.modalEl).toBe(modalEl);
    expect(appendChildSpy).toHaveBeenCalledWith(modalEl);
    expect(component.form).toBe(form);
    expect(component.permisoIdInput).toBe(permisoId);
    expect(component.nombreInput).toBe(nombre);
    expect(component.recursoInput).toBe(recurso);
    expect(component.accionInput).toBe(accion);
    expect(component.opcionMenuSelect).toBe(opcionMenu);
    expect(component.formTitle).toBe(formTitle);
    expect(component.btnText).toBe(btnText);
    expect(component.btnSubmit).toBe(btnSubmit);
    expect(component.errorAlert).toBe(errorAlert);
    expect(component.errorMessage).toBe(errorMessage);
    expect(component.loadingSpinner).toBe(loadingSpinner);
    expect(addEventListenerSpy).toHaveBeenCalledWith('submit', expect.any(Function));
  });

  it('onInit() - modalEl missing: console.error and returns early', async () => {
    const component = new PermissionFormComponent();
    component.innerHTML = '<div>No modal here</div>';

    await component.onInit();

    expect(consoleErrorSpy).toHaveBeenCalledWith('No se encontr\u00f3 el modal #permisoModal');
    expect(component.modalEl).toBeNull();
  });

  it('disconnectedCallback() - removes modal from body when parent is document.body', () => {
    const component = createComponent();
    const modalEl = component.querySelector('#permisoModal');
    document.body.appendChild(modalEl);
    component.modalEl = modalEl;

    component.disconnectedCallback();

    expect(document.body.contains(modalEl)).toBe(false);
  });

  it('llenarSelectOpcionesMenu() - calls apiRequest, fills select with options, selects value', async () => {
    const component = createComponent();
    await component.onInit();

    await component.llenarSelectOpcionesMenu(1);

    const options = component.opcionMenuSelect.querySelectorAll('option');
    expect(options.length).toBe(3);
    expect(options[0].value).toBe('');
    expect(options[1].value).toBe('1');
    expect(options[1].textContent).toBe('Menu1');
    expect(options[2].value).toBe('2');
    expect(options[2].textContent).toBe('Menu2');
    expect(component.opcionMenuSelect.value).toBe('1');
  });

  it('llenarSelectOpcionesMenu() - API error: console.error + ToastService.error', async () => {
    const component = createComponent();
    await component.onInit();

    window.fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
    await component.llenarSelectOpcionesMenu();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error cargando opciones de men\u00fa:', expect.any(Error));
    expect(ToastService.error).toHaveBeenCalledWith('Error al cargar opciones de men\u00fa.');
  });

  it('abrirModalCrear() - clears form and shows modal', async () => {
    const component = createComponent();
    await component.onInit();

    component.permisoIdInput.value = '5';
    component.nombreInput.value = 'Old';

    await component.abrirModalCrear();

    expect(component.permisoIdInput.value).toBe('');
    expect(component.nombreInput.value).toBe('');
    expect(component.recursoInput.value).toBe('');
    expect(component.accionInput.value).toBe('');
    expect(component.formTitle.textContent).toBe('Nuevo Permiso');
    expect(component.btnText.textContent).toBe('Guardar Permiso');
    expect(global.bootstrap.Modal.getOrCreateInstance).toHaveBeenCalledWith(component.modalEl);
  });

  it('abrirModalEditar(permiso) - fills form with permission data and shows modal', async () => {
    const component = createComponent();
    await component.onInit();

    const permisoData = { id: 9, nombre: 'Edit', recurso: 'res', accion: 'CREATE', opcion_menu_id: 2 };

    await component.abrirModalEditar(permisoData);

    expect(component.permisoIdInput.value).toBe('9');
    expect(component.nombreInput.value).toBe('Edit');
    expect(component.recursoInput.value).toBe('res');
    expect(component.accionInput.value).toBe('CREATE');
    expect(component.formTitle.textContent).toBe('Editar Permiso');
    expect(component.btnText.textContent).toBe('Actualizar Permiso');
    expect(component.opcionMenuSelect.value).toBe('2');
    expect(global.bootstrap.Modal.getOrCreateInstance).toHaveBeenCalledWith(component.modalEl);
  });

  it('guardarPermiso() - creates new permission (no id)', async () => {
    const component = createComponent();
    await component.onInit();

    component.nombreInput.value = 'New Perm';
    component.recursoInput.value = 'test-res';
    component.accionInput.value = 'READ';
    component.opcionMenuSelect.innerHTML = '<option value="1">Menu1</option>';
    component.opcionMenuSelect.value = '1';

    const e = { preventDefault: jest.fn() };
    await component.guardarPermiso(e);

    expect(e.preventDefault).toHaveBeenCalled();
    expect(PermissionService.create).toHaveBeenCalledWith({
      nombre: 'New Perm',
      recurso: 'test-res',
      accion: 'READ',
      opcion_menu_id: 1,
    });
    expect(ToastService.success).toHaveBeenCalledWith('Permiso creado correctamente.');
  });

  it('guardarPermiso() - updates existing permission (has id)', async () => {
    const component = createComponent();
    await component.onInit();

    component.permisoIdInput.value = '5';
    component.nombreInput.value = 'Updated Perm';
    component.recursoInput.value = 'up-res';
    component.accionInput.value = 'UPDATE';
    component.opcionMenuSelect.innerHTML = '<option value="2">Menu2</option>';
    component.opcionMenuSelect.value = '2';

    const e = { preventDefault: jest.fn() };
    await component.guardarPermiso(e);

    expect(e.preventDefault).toHaveBeenCalled();
    expect(PermissionService.update).toHaveBeenCalledWith('5', {
      nombre: 'Updated Perm',
      recurso: 'up-res',
      accion: 'UPDATE',
      opcion_menu_id: 2,
    });
    expect(ToastService.success).toHaveBeenCalledWith('Permiso actualizado correctamente.');
  });

  it('guardarPermiso() - validation fails', async () => {
    const component = createComponent();
    await component.onInit();

    component.nombreInput.setCustomValidity('error');

    const e = { preventDefault: jest.fn() };
    await component.guardarPermiso(e);

    expect(e.preventDefault).toHaveBeenCalled();
    expect(component.form.classList.contains('was-validated')).toBe(true);
    expect(PermissionService.create).not.toHaveBeenCalled();
    expect(PermissionService.update).not.toHaveBeenCalled();
  });

  it('guardarPermiso() - API error', async () => {
    const component = createComponent();
    await component.onInit();

    component.nombreInput.value = 'Fail Perm';
    component.recursoInput.value = 'fail-res';
    component.accionInput.value = 'READ';
    component.opcionMenuSelect.innerHTML = '<option value="1">Menu1</option>';
    component.opcionMenuSelect.value = '1';

    const apiError = new Error('Server error');
    PermissionService.create.mockRejectedValueOnce(apiError);

    const e = { preventDefault: jest.fn() };
    await component.guardarPermiso(e);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al guardar permiso:', apiError);
    expect(ToastService.error).toHaveBeenCalledWith('Server error');
    expect(component.btnSubmit.disabled).toBe(false);
  });

  it('setSubmitting(true) - disables button and shows spinner', async () => {
    const component = createComponent();
    await component.onInit();

    component.setSubmitting(true);

    expect(component.btnSubmit.disabled).toBe(true);
    expect(component.btnSubmit.innerHTML).toContain('spinner-border');
    expect(component.btnSubmit.dataset.originalText).toBe('Guardar Permiso');
  });

  it('setSubmitting(false) - enables button and restores text', async () => {
    const component = createComponent();
    await component.onInit();

    component.btnSubmit.dataset.originalText = 'Guardar Permiso';
    component.setSubmitting(false);

    expect(component.btnSubmit.disabled).toBe(false);
    const span = component.btnSubmit.querySelector('#btnText');
    expect(span).toBeTruthy();
    expect(span.textContent).toBe('Guardar Permiso');
  });

  it('limpiarError() - adds d-none class to errorAlert', async () => {
    const component = createComponent();
    await component.onInit();

    component.errorAlert.classList.remove('d-none');
    component.limpiarError();

    expect(component.errorAlert.classList.contains('d-none')).toBe(true);
  });
});
