import { BaseComponent } from '../../../../core/base-component.js';
import { UserService } from '../../services/user.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { CatalogoService } from '../../../../shared/services/catalogo.service.js';
import { RoleService } from '../../../role/services/role.service.js';

export class UserIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/user/components/index/user-index.component.html');
  }

  async onInit() {
    console.log('Página de mantenimiento de usuarios inicializada.');

    const btnNuevoRegistro = this.querySelector('#btn-nuevo-registro');
    if (btnNuevoRegistro && !AuthService.hasPermission('CREATE', 'usuarios')) {
      btnNuevoRegistro.classList.add('d-none');
    }
    const btnInvitar = this.querySelector('#btn-invitar-usuario');
    if (btnInvitar && !AuthService.hasPermission('CREATE', 'usuarios')) {
      btnInvitar.classList.add('d-none');
    }

    const tblDatos = this.querySelector('#tbl-datos-usuarios');

    if (tblDatos) {
      tblDatos.configure({
        columns: [
          {
            header: 'ID',
            key: 'id',
            class: 'ps-4 text-secondary fw-semibold',
            format: (id) => `#${id}`,
          },
          { header: 'Usuario', key: 'username', class: 'fw-semibold text-dark' },
          { header: 'Nombre', key: 'name' },
          { header: 'Email', key: 'email', class: 'text-muted' },
          {
            header: 'Roles',
            render: (user) =>
              user.roles && user.roles.length > 0
                ? user.roles
                    .map(
                      (r) =>
                        `<span class="badge bg-primary-soft text-primary me-1 small fw-semibold">${r.nombre}</span>`
                    )
                    .join('')
                : '-',
          },
          {
            header: 'Estado',
            render: (user) => `
              <span class="badge bg-${user.activo ? 'success' : 'danger'}-soft text-${user.activo ? 'success' : 'danger'} small fw-semibold">
                ${user.activo ? 'Activo' : 'Inactivo'}
              </span>
            `,
          },
          {
            header: 'Creado el',
            render: (user) =>
              user.created_at
                ? new Date(user.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '-',
          },
          {
            header: 'Acciones',
            class: 'text-center',
            actions: [
              ...(AuthService.hasPermission('UPDATE', 'usuarios')
                ? [
                    {
                      name: 'editar',
                      label: 'Editar',
                      icon: 'bi-pencil-square',
                      class: 'text-primary',
                    },
                  ]
                : []),
              ...(AuthService.hasPermission('DELETE', 'usuarios')
                ? [{ name: 'eliminar', label: 'Eliminar', icon: 'bi-trash', class: 'text-danger' }]
                : []),
            ],
          },
        ],
      });

      tblDatos.addEventListener('row-action', (e) => {
        const { action, item } = e.detail;
        if (action === 'editar') {
          window.location.hash = `#/usuarios/form?id=${item.id}`;
        } else if (action === 'eliminar') {
          this.eliminarUsuario(item.id, item.name);
        }
      });

      tblDatos.load(UserService.getAll);
    }

    await this.setupInviteModal();
  }

  async setupInviteModal() {
    const formInvite = this.querySelector('#form-invite-user');
    const selectRole = this.querySelector('#select-invite-role');
    const selectInstitution = this.querySelector('#select-invite-institution');
    const containerInstitution = this.querySelector('#container-invite-institution');
    const btnSubmit = this.querySelector('#btn-submit-invite');
    const spinner = this.querySelector('#spinner-submit-invite');
    
    if (!formInvite) return;

    // Load roles
    try {
      const rolesData = await RoleService.getAll(1, 100, null, { all: true });
      const roles = rolesData.data || rolesData;
      roles.forEach((r) => {
        const option = document.createElement('option');
        option.value = r.id;
        option.textContent = r.nombre;
        option.dataset.name = r.nombre;
        selectRole.appendChild(option);
      });
    } catch (e) {
      console.error('Error cargando roles:', e);
    }

    // Load institutions
    try {
      const institutions = await CatalogoService.getInstituciones();
      institutions.forEach((i) => {
        const option = document.createElement('option');
        option.value = i.id;
        option.textContent = i.nombre;
        selectInstitution.appendChild(option);
      });
    } catch (e) {
      console.error('Error cargando instituciones:', e);
    }

    // Handle role change to toggle institution field
    selectRole.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const roleName = selectedOption.dataset.name;
      if (roleName === 'Institucion') {
        containerInstitution.style.display = 'block';
        selectInstitution.setAttribute('required', 'required');
      } else {
        containerInstitution.style.display = 'none';
        selectInstitution.removeAttribute('required');
        selectInstitution.value = '';
      }
    });

    // Handle submit
    formInvite.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(formInvite);
      const payload = Object.fromEntries(formData.entries());
      if (!payload.institution_id) {
        delete payload.institution_id;
      }

      btnSubmit.disabled = true;
      spinner.classList.remove('d-none');

      try {
        await UserService.invite(payload);
        ToastService.success('Invitación enviada exitosamente.');
        
        // Hide modal
        const modalEl = this.querySelector('#inviteUserModal');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();
        
        // Reset form
        formInvite.reset();
        containerInstitution.style.display = 'none';
      } catch (error) {
        ToastService.error(error.message || 'Error al enviar invitación.');
      } finally {
        btnSubmit.disabled = false;
        spinner.classList.add('d-none');
      }
    });
  }

  async eliminarUsuario(id, name) {
    const isConfirmed = await ModalService.confirm(
      'Eliminar Usuario',
      `¿Estás seguro de que deseas eliminar el usuario "${name}"?<br>Esta acción lo removerá del sistema.`,
      'Eliminar',
      'Cancelar',
      'btn-danger'
    );

    if (isConfirmed) {
      try {
        await UserService.delete(id);
        ToastService.success(`Usuario "${name}" eliminado con éxito.`);
        const tblDatos = this.querySelector('#tbl-datos-usuarios');
        if (tblDatos) {
          await tblDatos.load(UserService.getAll);
        }
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        ToastService.error(`Error al eliminar: ${error.message}`);
      }
    }
  }
}

customElements.define('app-user-index', UserIndexComponent);
