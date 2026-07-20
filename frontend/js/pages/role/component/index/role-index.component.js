import { BaseComponent } from '../../../../core/base-component.js';
import { PermissionService } from '../../../permissions/services/permissions.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { RoleService } from '../../services/role.service.js';

export class RoleIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/role/component/index/role-index.component.html');
  }

  async onInit() {
    console.log('Página de roles inicializada.');
    const formComponent = this.querySelector('#app-role-form');
    const btnNuevoRol = this.querySelector('#btnNuevoRol');

    // 1. Cargar los roles inicialmente
    await this.cargarRoles();

    if (formComponent) {
      formComponent.addEventListener('rol-guardado', (e) => {
        ToastService.success(e.detail.mensaje);
        this.cargarRoles();
      });
    }

    if (btnNuevoRol) {
      if (!AuthService.hasPermission('CREATE', 'roles')) {
        btnNuevoRol.classList.add('d-none');
      } else if (formComponent) {
        btnNuevoRol.addEventListener('click', () => formComponent.abrirModalCrear());
      }
    }

    // 4. Escuchar el submit del formulario de asignación de permisos
    const assignForm = this.querySelector('#assignPermissionsForm');
    if (assignForm) {
      assignForm.addEventListener('submit', (e) => this.guardarPermisosAsignados(e));
    }

    // 5. Botón cerrar panel de permisos
    const btnClosePermissions = this.querySelector('#btnClosePermissions');
    if (btnClosePermissions) {
      btnClosePermissions.addEventListener('click', (e) => {
        e.preventDefault();
        this.querySelector('#permissionsAccordionContainer').classList.add('d-none');
      });
    }
  }

  /**
   * Carga los roles del backend y llena el grid de tarjetas
   */
  async cargarRoles() {
    const rolesGrid = this.querySelector('#rolesGrid');
    const loadingSpinner = this.querySelector('#loadingSpinner');
    const emptyState = this.querySelector('#emptyState');
    const totalRolesBadge = this.querySelector('#totalRolesBadge');

    if (!rolesGrid) return;

    loadingSpinner.classList.remove('d-none');
    rolesGrid.classList.add('d-none');
    if (emptyState) emptyState.classList.add('d-none');

    try {
      const response = await RoleService.getAll();
      this.rolesData = response || [];
      const roles = this.rolesData;

      if (totalRolesBadge) {
        totalRolesBadge.textContent = `${roles.length} Registros`;
      }

      if (roles.length === 0) {
        if (emptyState) emptyState.classList.remove('d-none');
        loadingSpinner.classList.add('d-none');
        return;
      }

      const canEdit = AuthService.hasPermission('UPDATE', 'roles');
      const canDelete = AuthService.hasPermission('DELETE', 'roles');

      // Render cards using template literal
      rolesGrid.innerHTML = roles
        .map(
          (rol) => `
        <div class="col-md-4 col-sm-6">
          <div class="card h-100 border shadow-sm role-card cursor-pointer" data-id="${rol.id}" style="transition: all 0.2s ease;">
            <div class="card-body d-flex align-items-center gap-3 p-3">
              <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex justify-content-center align-items-center" style="width: 48px; height: 48px; flex-shrink: 0;">
                <i class="bi bi-key fs-5"></i>
              </div>
              <div class="flex-grow-1 text-truncate">
                <h6 class="fw-bold mb-0 text-dark text-truncate">${rol.nombre}</h6>
                <span class="text-muted small">${rol.descripcion || ''}</span>
              </div>
              <div>
                <i class="bi bi-chevron-right text-muted"></i>
              </div>
              <div class="dropdown ms-2" onclick="event.stopPropagation()">
                <button class="btn btn-sm btn-light border-0 p-1 rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                  ${canEdit ? `<li><button class="dropdown-item d-flex align-items-center gap-2 text-primary small fw-medium" type="button" data-action="editar"><i class="bi bi-pencil-square"></i> Editar</button></li>` : ''}
                  ${canDelete ? `<li><button class="dropdown-item d-flex align-items-center gap-2 text-danger small fw-medium" type="button" data-action="eliminar"><i class="bi bi-trash"></i> Eliminar</button></li>` : ''}
                </ul>
              </div>
            </div>
          </div>
        </div>
      `
        )
        .join('');

      // Bind events to rendered elements
      roles.forEach((rol) => {
        const cardEl = rolesGrid.querySelector(`.role-card[data-id="${rol.id}"]`);
        if (cardEl) {
          // Hover effects
          cardEl.addEventListener('mouseover', () => cardEl.classList.add('shadow'));
          cardEl.addEventListener('mouseout', () => cardEl.classList.remove('shadow'));

          // Open permissions on click
          cardEl.addEventListener('click', () => this.abrirPanelPermisos(rol));

          // Action buttons
          const formComponent = this.querySelector('#app-role-form');
          const btnEdit = cardEl.querySelector('[data-action="editar"]');
          if (btnEdit && formComponent) {
            btnEdit.addEventListener('click', (e) => {
              e.stopPropagation();
              formComponent.abrirModalEditar(rol, this.rolesData);
            });
          }

          const btnDelete = cardEl.querySelector('[data-action="eliminar"]');
          if (btnDelete) {
            btnDelete.addEventListener('click', (e) => {
              e.stopPropagation();
              this.eliminarRol(rol.id, rol.nombre);
            });
          }
        }
      });

      loadingSpinner.classList.add('d-none');
      rolesGrid.classList.remove('d-none');
    } catch (error) {
      console.error('Error cargando roles:', error);
      loadingSpinner.classList.add('d-none');
      ToastService.error(`Error al cargar roles: ${error.message}`);
    }
  }

  /**
   * Elimina un rol
   */
  async eliminarRol(id, nombre) {
    const isConfirmed = await ModalService.confirm(
      'Eliminar Rol',
      `¿Estás seguro de que deseas eliminar el rol "${nombre}"?<br>Esta acción es irreversible.`,
      'Eliminar',
      'Cancelar',
      'btn-danger'
    );
    if (isConfirmed) {
      try {
        await RoleService.delete(id);
        ToastService.success(`Rol "${nombre}" eliminado con éxito.`);
        await this.cargarRoles();
      } catch (error) {
        console.error('Error al eliminar rol:', error);
        ToastService.error(`Error al eliminar: ${error.message}`);
      }
    }
  }

  /**
   * Abre el panel Acordeón de Permisos y carga los checkboxes
   */
  async abrirPanelPermisos(rol) {
    const accordionContainer = this.querySelector('#permissionsAccordionContainer');
    this.querySelector('#assignRoleId').value = rol.id;
    this.querySelector('#activeRoleName').textContent = rol.nombre;
    const accordionMenus = this.querySelector('#accordionMenus');

    accordionMenus.innerHTML =
      '<div class="text-center text-muted small py-4">Cargando permisos...</div>';
    accordionContainer.classList.remove('d-none');

    // Scroll al contenedor de permisos
    accordionContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const canAssign = AuthService.hasPermission('UPDATE', 'roles');
    const btnAssignSubmit = this.querySelector('#btnAssignSubmit');
    if (btnAssignSubmit) {
      if (canAssign) {
        btnAssignSubmit.classList.remove('d-none');
      } else {
        btnAssignSubmit.classList.add('d-none');
      }
    }

    try {
      const [todosPermisosResponse, rolDetalle] = await Promise.all([
        PermissionService.getAll(true),
        RoleService.getById(rol.id),
      ]);

      const todosPermisos = todosPermisosResponse || [];
      const permisosAsignados = rolDetalle.permisos ? rolDetalle.permisos.map((p) => p.id) : [];

      accordionMenus.innerHTML = '';

      if (!todosPermisos || todosPermisos.length === 0) {
        accordionMenus.innerHTML =
          '<div class="text-center text-muted small py-4">No hay permisos registrados en el sistema.</div>';
        return;
      }

      // Agrupar permisos por menú
      const permisosAgrupados = {};
      todosPermisos.forEach((permiso) => {
        const menuNombre = permiso.opcion_menu
          ? permiso.opcion_menu.nombre
          : permiso.opcionMenu
            ? permiso.opcionMenu.nombre
            : 'Menú General';
        if (!permisosAgrupados[menuNombre]) {
          permisosAgrupados[menuNombre] = [];
        }
        permisosAgrupados[menuNombre].push(permiso);
      });

      let accordionIndex = 0;
      let accordionHtml = '';

      for (const [menuNombre, permisos] of Object.entries(permisosAgrupados)) {
        const headingId = `headingMenu${accordionIndex}`;
        const collapseId = `collapseMenu${accordionIndex}`;
        const allChecked =
          permisos.length > 0 && permisos.every((p) => permisosAsignados.includes(p.id));

        accordionHtml += `
          <div class="accordion-item border-0 mb-3 rounded shadow-sm overflow-hidden">
            <h2 class="accordion-header" id="${headingId}">
              <button class="accordion-button bg-white text-dark fw-bold border-bottom ${accordionIndex === 0 ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${accordionIndex === 0 ? 'true' : 'false'}" aria-controls="${collapseId}">
                <div class="d-flex align-items-center gap-2 w-100 me-3">
                  <input type="checkbox" class="form-check-input mt-0 select-all-menu" data-menu-index="${accordionIndex}" ${allChecked ? 'checked' : ''} ${!canAssign ? 'disabled' : ''} style="width: 1.2rem; height: 1.2rem; cursor: pointer;">
                  <span>${menuNombre}</span>
                </div>
              </button>
            </h2>
            <div id="${collapseId}" class="accordion-collapse collapse ${accordionIndex === 0 ? 'show' : ''}" aria-labelledby="${headingId}">
              <div class="accordion-body bg-light">
                <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                  ${permisos
                    .map(
                      (permiso) => `
                    <div class="col">
                      <div class="form-check bg-white p-3 rounded shadow-sm border h-100 d-flex align-items-center">
                        <input class="form-check-input permission-checkbox flex-shrink-0 mt-0 me-3" type="checkbox" value="${permiso.id}" id="permiso_${permiso.id}" ${permisosAsignados.includes(permiso.id) ? 'checked' : ''} ${!canAssign ? 'disabled' : ''} style="width: 1.2rem; height: 1.2rem; cursor: pointer;">
                        <label class="form-check-label user-select-none w-100" for="permiso_${permiso.id}" style="cursor: pointer;">
                          <div class="fw-semibold text-dark">${permiso.nombre}</div>
                          <div class="text-muted small mt-1" style="font-size: 0.8rem; line-height: 1.2;">
                            <span class="badge bg-secondary-soft text-dark px-2 py-1">${permiso.accion || '-'}</span> 
                            ${permiso.recurso || ''}
                          </div>
                        </label>
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            </div>
          </div>
        `;
        accordionIndex++;
      }

      accordionMenus.innerHTML = accordionHtml;

      // Bind events for checkboxes
      accordionIndex = 0;
      for (const [menuNombre, permisos] of Object.entries(permisosAgrupados)) {
        const itemEl = accordionMenus.children[accordionIndex];
        if (itemEl) {
          const selectAllCheckbox = itemEl.querySelector('.select-all-menu');
          const checkboxes = itemEl.querySelectorAll('.permission-checkbox');

          // Prevent accordion toggle when clicking select-all checkbox
          selectAllCheckbox.addEventListener('click', (e) => {
            e.stopPropagation();
          });

          // Toggle all checkboxes in this group
          selectAllCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            checkboxes.forEach((cb) => {
              if (!cb.disabled) {
                cb.checked = isChecked;
              }
            });
          });

          // Update select-all state when individual checkboxes change
          checkboxes.forEach((cb) => {
            cb.addEventListener('change', () => {
              const allCbs = Array.from(checkboxes);
              const checkedCbs = allCbs.filter((c) => c.checked);
              selectAllCheckbox.checked = checkedCbs.length === allCbs.length;
              selectAllCheckbox.indeterminate =
                checkedCbs.length > 0 && checkedCbs.length < allCbs.length;
            });
          });

          // Initialize indeterminate state
          const allCbs = Array.from(checkboxes);
          const checkedCbs = allCbs.filter((c) => c.checked);
          selectAllCheckbox.indeterminate =
            checkedCbs.length > 0 && checkedCbs.length < allCbs.length;
        }
        accordionIndex++;
      }
    } catch (error) {
      console.error('Error cargando permisos para asignar:', error);
      accordionMenus.innerHTML =
        '<div class="text-center text-danger small py-4">Error al cargar la lista de permisos.</div>';
    }
  }

  /**
   * Guarda los permisos seleccionados para el rol
   */
  async guardarPermisosAsignados(e) {
    e.preventDefault();
    const roleId = this.querySelector('#assignRoleId').value;

    // Recolectar IDs seleccionados
    const checkboxes = this.querySelectorAll('.permission-checkbox:checked');
    const permisosIds = Array.from(checkboxes).map((cb) => parseInt(cb.value));

    const btnAssignSubmit = this.querySelector('#btnAssignSubmit');
    const btnText = btnAssignSubmit.innerHTML;
    btnAssignSubmit.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
    btnAssignSubmit.disabled = true;

    try {
      await RoleService.assignPermissions(roleId, { permisos: permisosIds });

      ToastService.success('Permisos asignados correctamente.');

      // Opcionalmente, subir el scroll arriba
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error asignando permisos:', error);
      alert(`Error al asignar permisos: ${error.message}`);
    } finally {
      btnAssignSubmit.innerHTML = btnText;
      btnAssignSubmit.disabled = false;
    }
  }
}

customElements.define('app-role-index', RoleIndexComponent);
