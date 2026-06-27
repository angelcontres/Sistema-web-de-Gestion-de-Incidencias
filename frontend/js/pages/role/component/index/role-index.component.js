import { BaseComponent } from '../../../../core/base-component.js';
import { apiRequest } from '../../../../core/api.js';
import { AuthService } from '../../../../core/auth.service.js';

export class RoleIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/role/component/index/role-index.component.html');
  }

  async onInit() {
    console.log('Página de roles inicializada.');

    // 1. Cargar los roles inicialmente
    await this.cargarRoles();

    // Hide create button if user lacks permission
    const btnNuevoRol = this.querySelector('#btnNuevoRol');
    if (btnNuevoRol) {
      if (!AuthService.hasPermission('CREATE', 'roles')) {
        btnNuevoRol.classList.add('d-none');
      } else {
        btnNuevoRol.addEventListener('click', () => this.abrirModalCrear());
      }
    }

    // 3. Escuchar el submit del formulario del modal
    const form = this.querySelector('#roleForm');
    if (form) {
      form.addEventListener('submit', (e) => this.guardarRol(e));
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
      const response = await apiRequest('/v1/roles');
      const roles = response || [];

      if (totalRolesBadge) {
        totalRolesBadge.textContent = `${roles.length} Registros`;
      }

      rolesGrid.innerHTML = '';

      if (roles.length === 0) {
        if (emptyState) emptyState.classList.remove('d-none');
        loadingSpinner.classList.add('d-none');
        return;
      }

      roles.forEach((rol) => {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-sm-6';

        const card = document.createElement('div');
        card.className = 'card h-100 border shadow-sm role-card';
        card.style.cursor = 'pointer';
        card.style.transition = 'all 0.2s ease';
        card.onmouseover = () => card.classList.add('shadow');
        card.onmouseout = () => card.classList.remove('shadow');

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body d-flex align-items-center gap-3 p-3';

        // Icon
        const iconDiv = document.createElement('div');
        iconDiv.className =
          'bg-primary bg-opacity-10 text-primary rounded-circle d-flex justify-content-center align-items-center';
        iconDiv.style.width = '48px';
        iconDiv.style.height = '48px';
        iconDiv.style.flexShrink = '0';
        iconDiv.innerHTML = '<i class="bi bi-key fs-5"></i>';

        // Text info
        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex-grow-1 text-truncate';
        infoDiv.innerHTML = `
          <h6 class="fw-bold mb-0 text-dark text-truncate">${rol.nombre}</h6>
          <span class="text-muted small">${rol.descripcion}</span>
        `;

        // Chevron
        const chevronDiv = document.createElement('div');
        chevronDiv.innerHTML = '<i class="bi bi-chevron-right text-muted"></i>';

        // Context menu (3 dots)
        const dropdownDiv = document.createElement('div');
        dropdownDiv.className = 'dropdown ms-2';

        const btnDropdown = document.createElement('button');
        btnDropdown.className =
          'btn btn-sm btn-light border-0 p-1 rounded-circle d-flex align-items-center justify-content-center';
        btnDropdown.type = 'button';
        btnDropdown.style.width = '32px';
        btnDropdown.style.height = '32px';
        btnDropdown.setAttribute('data-bs-toggle', 'dropdown');
        btnDropdown.onclick = (e) => e.stopPropagation();
        btnDropdown.innerHTML = '<i class="bi bi-three-dots-vertical"></i>';

        const ulMenu = document.createElement('ul');
        ulMenu.className = 'dropdown-menu dropdown-menu-end shadow-sm border-0';

        const canEdit = AuthService.hasPermission('UPDATE', 'roles');
        const canDelete = AuthService.hasPermission('DELETE', 'roles');

        if (canEdit) {
          const liEdit = document.createElement('li');
          const btnEdit = document.createElement('button');
          btnEdit.className =
            'dropdown-item d-flex align-items-center gap-2 text-primary small fw-medium';
          btnEdit.innerHTML = '<i class="bi bi-pencil-square"></i> Editar';
          btnEdit.onclick = (e) => {
            e.stopPropagation();
            this.abrirModalEditar(rol, roles);
          };
          liEdit.appendChild(btnEdit);
          ulMenu.appendChild(liEdit);
        }

        if (canDelete) {
          const liDelete = document.createElement('li');
          const btnDelete = document.createElement('button');
          btnDelete.className =
            'dropdown-item d-flex align-items-center gap-2 text-danger small fw-medium';
          btnDelete.innerHTML = '<i class="bi bi-trash"></i> Eliminar';
          btnDelete.onclick = (e) => {
            e.stopPropagation();
            this.eliminarRol(rol.id, rol.nombre);
          };
          liDelete.appendChild(btnDelete);
          ulMenu.appendChild(liDelete);
        }

        if (!canEdit && !canDelete) {
          btnDropdown.classList.add('d-none');
        }

        dropdownDiv.appendChild(btnDropdown);
        dropdownDiv.appendChild(ulMenu);

        // Append everything
        cardBody.appendChild(iconDiv);
        cardBody.appendChild(infoDiv);
        cardBody.appendChild(chevronDiv);
        cardBody.appendChild(dropdownDiv);
        card.appendChild(cardBody);

        // Open permissions when clicking the card
        card.onclick = () => this.abrirPanelPermisos(rol);

        col.appendChild(card);
        rolesGrid.appendChild(col);
      });

      loadingSpinner.classList.add('d-none');
      rolesGrid.classList.remove('d-none');
    } catch (error) {
      console.error('Error cargando roles:', error);
      loadingSpinner.classList.add('d-none');
      this.mostrarAlertaError(`Error al cargar roles: ${error.message}`);
    }
  }

  /**
   * Llena las opciones del select "padre_id" en el formulario del modal
   */
  llenarSelectPadre(roles, excluirId = null, valorSeleccionado = null) {
    const selectPadre = this.querySelector('#padre_id');
    if (!selectPadre) return;

    selectPadre.innerHTML = '<option value="" selected>Ninguno (Rol Principal)</option>';

    roles.forEach((rol) => {
      if (excluirId && rol.id == excluirId) return;

      const option = document.createElement('option');
      option.value = rol.id;
      option.textContent = rol.nombre;
      selectPadre.appendChild(option);
    });

    if (valorSeleccionado) {
      selectPadre.value = valorSeleccionado;
    }
  }

  /**
   * Abre el modal en modo Creación
   */
  async abrirModalCrear() {
    this.limpiarErroresModal();
    this.querySelector('#roleForm').classList.remove('was-validated');

    this.querySelector('#roleId').value = '';
    this.querySelector('#nombre').value = '';
    this.querySelector('#descripcion').value = '';
    this.querySelector('#padre_id').value = '';

    this.querySelector('#roleModalLabel').textContent = 'Nuevo Rol';
    this.querySelector('#btnText').textContent = 'Guardar Rol';

    try {
      const response = await apiRequest('/v1/roles');
      this.llenarSelectPadre(response || []);
    } catch (error) {
      console.error('Error cargando roles para select:', error);
    }

    const modalEl = this.querySelector('#roleModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  /**
   * Abre el modal en modo Edición
   */
  async abrirModalEditar(rol, todosLosRoles) {
    this.limpiarErroresModal();
    this.querySelector('#roleForm').classList.remove('was-validated');

    this.querySelector('#roleId').value = rol.id;
    this.querySelector('#nombre').value = rol.nombre;
    this.querySelector('#descripcion').value = rol.descripcion || '';

    this.querySelector('#roleModalLabel').textContent = 'Editar Rol';
    this.querySelector('#btnText').textContent = 'Actualizar Rol';

    this.llenarSelectPadre(todosLosRoles, rol.id, rol.padre_id);

    const modalEl = this.querySelector('#roleModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  /**
   * Guarda el rol (POST para crear, PUT para editar)
   */
  async guardarRol(e) {
    e.preventDefault();
    const form = this.querySelector('#roleForm');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const roleId = this.querySelector('#roleId').value;
    const nombre = this.querySelector('#nombre').value.trim();
    const descripcion = this.querySelector('#descripcion').value.trim();
    const padreSelectVal = this.querySelector('#padre_id').value;
    const padre_id = padreSelectVal ? parseInt(padreSelectVal) : null;

    const payload = { nombre, descripcion, padre_id };

    try {
      const endpoint = roleId ? `/v1/roles/${roleId}` : '/v1/roles';
      const method = roleId ? 'PUT' : 'POST';

      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      const modalEl = this.querySelector('#roleModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      this.mostrarAlertaExito(
        roleId ? 'Rol actualizado correctamente.' : 'Rol creado correctamente.'
      );
      await this.cargarRoles();
    } catch (error) {
      console.error('Error al guardar rol:', error);
      this.mostrarErrorModal(error.message || 'Error al procesar el formulario.');
    }
  }

  /**
   * Elimina un rol
   */
  async eliminarRol(id, nombre) {
    if (
      confirm(
        `¿Estás seguro de que deseas eliminar el rol "${nombre}"?\nEsta acción es irreversible.`
      )
    ) {
      try {
        await apiRequest(`/v1/roles/${id}`, { method: 'DELETE' });
        this.mostrarAlertaExito(`Rol "${nombre}" eliminado con éxito.`);
        await this.cargarRoles();
      } catch (error) {
        console.error('Error al eliminar rol:', error);
        alert(`Error al eliminar: ${error.message}`);
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
        apiRequest('/v1/permisos'),
        apiRequest(`/v1/roles/${rol.id}`),
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
      for (const [menuNombre, permisos] of Object.entries(permisosAgrupados)) {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item border-0 mb-3 rounded shadow-sm overflow-hidden';

        const headingId = `headingMenu${accordionIndex}`;
        const collapseId = `collapseMenu${accordionIndex}`;

        // Header
        const h2 = document.createElement('h2');
        h2.className = 'accordion-header';
        h2.id = headingId;

        const button = document.createElement('button');
        button.className = `accordion-button bg-white text-dark fw-bold border-bottom ${accordionIndex === 0 ? '' : 'collapsed'}`;
        button.type = 'button';
        button.setAttribute('data-bs-toggle', 'collapse');
        button.setAttribute('data-bs-target', `#${collapseId}`);
        button.setAttribute('aria-expanded', accordionIndex === 0 ? 'true' : 'false');
        button.setAttribute('aria-controls', collapseId);
        const allChecked = permisos.length > 0 && permisos.every(p => permisosAsignados.includes(p.id));
        const someChecked = permisos.some(p => permisosAsignados.includes(p.id));

        button.innerHTML = `
          <div class="d-flex align-items-center gap-2 w-100 me-3">
            <input type="checkbox" class="form-check-input mt-0 select-all-menu" ${allChecked ? 'checked' : ''} ${!canAssign ? 'disabled' : ''} style="width: 1.2rem; height: 1.2rem; cursor: pointer;">
            <span>${menuNombre}</span>
          </div>
        `;

        const selectAllCheckbox = button.querySelector('.select-all-menu');
        selectAllCheckbox.indeterminate = someChecked && !allChecked;

        selectAllCheckbox.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        selectAllCheckbox.addEventListener('change', (e) => {
          const isChecked = e.target.checked;
          const checkboxes = row.querySelectorAll('.permission-checkbox');
          checkboxes.forEach(cb => {
            if (!cb.disabled) cb.checked = isChecked;
          });
        });

        h2.appendChild(button);
        accordionItem.appendChild(h2);

        // Body
        const collapseDiv = document.createElement('div');
        collapseDiv.id = collapseId;
        collapseDiv.className = `accordion-collapse collapse ${accordionIndex === 0 ? 'show' : ''}`;
        collapseDiv.setAttribute('aria-labelledby', headingId);
        // Si queremos que solo haya uno abierto a la vez, descomentar la siguiente línea:
        // collapseDiv.setAttribute('data-bs-parent', '#accordionMenus');

        const accordionBody = document.createElement('div');
        accordionBody.className = 'accordion-body bg-light';

        const row = document.createElement('div');
        row.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3';

        permisos.forEach((permiso) => {
          const col = document.createElement('div');
          col.className = 'col';

          const formCheck = document.createElement('div');
          formCheck.className =
            'form-check bg-white p-3 rounded shadow-sm border h-100 d-flex align-items-center';

          const checkbox = document.createElement('input');
          checkbox.className = 'form-check-input permission-checkbox flex-shrink-0 mt-0 me-3';
          checkbox.type = 'checkbox';
          checkbox.value = permiso.id;
          checkbox.id = `permiso_${permiso.id}`;
          checkbox.style.width = '1.2rem';
          checkbox.style.height = '1.2rem';
          checkbox.style.cursor = 'pointer';

          if (permisosAsignados.includes(permiso.id)) {
            checkbox.checked = true;
          }

          if (!canAssign) {
            checkbox.disabled = true;
          }

          checkbox.addEventListener('change', () => {
             const allCbs = Array.from(row.querySelectorAll('.permission-checkbox'));
             const checkedCbs = allCbs.filter(cb => cb.checked);
             selectAllCheckbox.checked = checkedCbs.length === allCbs.length;
             selectAllCheckbox.indeterminate = checkedCbs.length > 0 && checkedCbs.length < allCbs.length;
          });

          const label = document.createElement('label');
          label.className = 'form-check-label user-select-none w-100';
          label.htmlFor = `permiso_${permiso.id}`;
          label.style.cursor = 'pointer';
          label.innerHTML = `
            <div class="fw-semibold text-dark">${permiso.nombre}</div>
            <div class="text-muted small mt-1" style="font-size: 0.8rem; line-height: 1.2;">
              <span class="badge bg-secondary-soft text-dark px-2 py-1">${permiso.accion || '-'}</span> 
              ${permiso.recurso || ''}
            </div>
          `;

          formCheck.appendChild(checkbox);
          formCheck.appendChild(label);
          col.appendChild(formCheck);
          row.appendChild(col);
        });

        accordionBody.appendChild(row);
        collapseDiv.appendChild(accordionBody);
        accordionItem.appendChild(collapseDiv);

        accordionMenus.appendChild(accordionItem);
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
      await apiRequest(`/v1/roles/${roleId}/permisos`, {
        method: 'POST',
        body: JSON.stringify({ permisos: permisosIds }),
      });

      this.mostrarAlertaExito('Permisos asignados correctamente.');

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

  /**
   * Métodos helpers de Alertas
   */
  mostrarAlertaExito(message) {
    const successAlert = this.querySelector('#successAlert');
    const successMessage = this.querySelector('#successMessage');
    if (successAlert && successMessage) {
      successMessage.textContent = message;
      successAlert.classList.remove('d-none');
      setTimeout(() => successAlert.classList.add('d-none'), 4000);
    }
  }

  mostrarAlertaError(message) {
    const errorAlert = this.querySelector('#errorAlert');
    const errorMessage = this.querySelector('#errorMessage');
    if (errorAlert && errorMessage) {
      errorMessage.textContent = message;
      errorAlert.classList.remove('d-none');
    }
  }

  mostrarErrorModal(message) {
    const modalErrorAlert = this.querySelector('#modalErrorAlert');
    const modalErrorMessage = this.querySelector('#modalErrorMessage');
    if (modalErrorAlert && modalErrorMessage) {
      modalErrorMessage.textContent = message;
      modalErrorAlert.classList.remove('d-none');
    }
  }

  limpiarErroresModal() {
    const modalErrorAlert = this.querySelector('#modalErrorAlert');
    if (modalErrorAlert) modalErrorAlert.classList.add('d-none');
  }
}

customElements.define('app-role-index', RoleIndexComponent);
