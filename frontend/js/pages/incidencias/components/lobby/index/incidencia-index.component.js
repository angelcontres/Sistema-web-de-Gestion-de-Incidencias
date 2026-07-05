import { BaseComponent } from '../../../../../core/base-component.js';
import { IncidenciaService } from '../../../services/incidencia.service.js';
import { AuthService } from '../../../../../core/auth.service.js';

export class IncidenciaIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/incidencias/components/index/incidencia-index.component.html');
  }

  async onInit() {
    console.log('Página de mantenimiento de incidencias inicializada.');

    const btnNuevoRegistro = this.querySelector('#btn-nuevo-registro');
    if (btnNuevoRegistro && !AuthService.hasPermission('Crear Incidencia')) {
      btnNuevoRegistro.classList.add('d-none');
    }

    const tblDatos = this.querySelector('#tbl-datos-incidencias');

    if (tblDatos) {
      tblDatos.configure({
        columns: [
          {
            header: 'ID',
            key: 'id',
            class: 'ps-4 text-secondary fw-semibold',
            format: (id) => `#${id}`,
          },
          {
            header: 'Clasificación',
            render: (inc) => {
              const tipo = inc.tipo ? inc.tipo.nombre : '-';
              const subTipo = inc.sub_tipo
                ? inc.sub_tipo.nombre
                : inc.subTipo
                  ? inc.subTipo.nombre
                  : '-';
              return `<div class="fw-semibold text-dark">${tipo}</div><div class="text-muted small">${subTipo}</div>`;
            },
          },
          {
            header: 'Descripción',
            render: (inc) =>
              `<div class="text-truncate" style="max-width: 250px;" title="${inc.incidencia_descripcion || ''}">${inc.incidencia_descripcion || 'Sin descripción.'}</div>`,
          },
          {
            header: 'Ubicación / Dirección',
            render: (inc) => {
              const detalle = inc.direccion ? inc.direccion.detalle : 'Sin dirección.';
              const pais =
                inc.direccion && inc.direccion.territorio && inc.direccion.territorio.pais
                  ? inc.direccion.territorio.pais.nombre
                  : '';
              return `<div>${detalle}</div><div class="text-muted small">${pais}</div>`;
            },
          },
          {
            header: 'Afectados',
            key: 'cantidad_afectados_incidencia',
            class: 'text-center fw-bold',
          },
          {
            header: 'Prioridad',
            render: (inc) => {
              if (inc.prioridad) {
                const color = inc.prioridad.color_hex || '#6c757d';
                return `<span class="badge rounded-pill px-2.5 py-1 small fw-semibold" style="background-color: ${color}20; color: ${color}; border: 1px solid ${color}40;">
                  ${inc.prioridad.nombre}
                </span>`;
              }
              return '-';
            },
          },
          {
            header: 'Estado',
            render: (inc) => {
              if (inc.estado) {
                let badgeClass = 'secondary';
                if (inc.estado.nombre === 'Aprobado') badgeClass = 'success';
                else if (inc.estado.nombre === 'Rechazado') badgeClass = 'danger';
                else if (inc.estado.nombre === 'En Revisión') badgeClass = 'warning';
                return `<span class="badge bg-${badgeClass}-soft text-${badgeClass} rounded-pill px-2.5 py-1 small fw-semibold">
                  ${inc.estado.nombre}
                </span>`;
              }
              return '-';
            },
          },
          {
            header: 'Atendido por',
            render: (inc) =>
              inc.institucion
                ? `<span class="fw-medium text-secondary">${inc.institucion.nombre}</span>`
                : '<span class="text-muted small">No asignado</span>',
          },
          {
            header: 'Acciones',
            class: 'text-center pe-4',
            actions: [
              ...(AuthService.hasPermission('Actualizar Incidencia')
                ? [
                    {
                      name: 'editar',
                      label: 'Editar',
                      icon: 'bi-pencil-square',
                      class: 'text-primary',
                    },
                  ]
                : []),
              ...(AuthService.hasPermission('Eliminar Incidencia')
                ? [{ name: 'eliminar', label: 'Eliminar', icon: 'bi-trash', class: 'text-danger' }]
                : []),
            ],
          },
        ],
      });

      tblDatos.addEventListener('row-action', (e) => {
        const { action, item } = e.detail;
        if (action === 'editar') {
          window.location.hash = `#/incidencias/form?id=${item.id}`;
        } else if (action === 'eliminar') {
          this.eliminarIncidencia(item.id);
        }
      });

      tblDatos.load(IncidenciaService.getAll);
    }
  }

  async eliminarIncidencia(id) {
    if (confirm(`¿Estás seguro de que deseas eliminar la incidencia #${id}?`)) {
      try {
        await IncidenciaService.delete(id);
        this.mostrarAlertaExito(`Incidencia #${id} eliminada con éxito.`);
        const tblDatos = this.querySelector('#tbl-datos-incidencias');
        if (tblDatos) {
          await tblDatos.load(IncidenciaService.getAll);
        }
      } catch (error) {
        console.error('Error al eliminar incidencia:', error);
        this.mostrarAlertaError(`Error al eliminar: ${error.message}`);
      }
    }
  }

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
}

customElements.define('app-incidencia-index', IncidenciaIndexComponent);
