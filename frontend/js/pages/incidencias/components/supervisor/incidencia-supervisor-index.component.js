import { BaseComponent } from '../../../../core/base-component.js';
import { IncidenciaService } from '../../services/incidencia.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { CatalogoService } from '../../../../shared/services/catalogo.service.js';

export class IncidenciaSupervisorIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/incidencias/components/supervisor/incidencia-supervisor-index.component.html');
    this.currentEstadoFilter = '3'; // En Revisión default
    this.categorias = [];
  }

  async onInit() {
    console.log('Componente de despacho del supervisor inicializado.');

    const tblDatos = this.querySelector('#tbl-datos-supervisor');
    const tabs = this.querySelectorAll('#supervisorTabs button');

    // Cargar catálogo de categorías para autocompletar instituciones
    try {
      this.categorias = (await CatalogoService.getCategoriasIncidencia()) || [];
    } catch (e) {
      console.warn('Error loading subcategories:', e);
    }

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
              `<div class="text-truncate" style="max-width: 200px;" title="${inc.incidencia_descripcion || ''}">${inc.incidencia_descripcion || 'Sin descripción.'}</div>`,
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
                if (inc.estado.nombre === 'Resuelto') badgeClass = 'success';
                else if (inc.estado.nombre === 'En Revisión') badgeClass = 'warning';
                else if (inc.estado.nombre === 'En Proceso') badgeClass = 'info';
                else if (inc.estado.nombre === 'Pendiente') badgeClass = 'danger';
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
            render: (inc) => {
              // Add a "Despachar" action button in the list if the state is 'En Revisión' (3)
              const showDespachar = inc.estado_id === 3;
              const despacharBtn = showDespachar
                ? `
                <button type="button" class="btn btn-sm btn-success-soft text-success me-1 px-2.5 py-1 rounded-pill fw-semibold" data-action="despachar" title="Despachar a institución">
                  <i class="bi bi-send-fill me-1"></i>Despachar
                </button>
              `
                : '';
              return `
                <div class="d-flex align-items-center justify-content-center">
                  ${despacharBtn}
                  <button type="button" class="btn btn-sm btn-outline-primary px-2.5 py-1 rounded-pill fw-semibold" data-action="revisar" title="Revisar y editar">
                    <i class="bi bi-search me-1"></i>Revisar
                  </button>
                </div>
              `;
            },
          },
        ],
      });

      tblDatos.addEventListener('row-action', (e) => {
        const { action, item } = e.detail;
        if (action === 'revisar') {
          window.location.hash = `#/incidencias/form?id=${item.id}`;
        } else if (action === 'despachar') {
          this.despacharIncidencia(item);
        }
      });

      // Add double click on table rows to open form view
      tblDatos.addEventListener('dblclick', (e) => {
        const tr = e.target.closest('tr');
        if (tr) {
          const index = tr.getAttribute('data-row-index');
          const item = tblDatos.items[index];
          if (item) {
            window.location.hash = `#/incidencias/form?id=${item.id}`;
          }
        }
      });

      // Tab Filtering listeners
      tabs.forEach((tab) => {
        tab.addEventListener('click', (e) => {
          tabs.forEach((t) => {
            t.classList.remove('active', 'text-primary');
            t.classList.add('text-secondary');
          });
          e.currentTarget.classList.add('active', 'text-primary');
          e.currentTarget.classList.remove('text-secondary');

          this.currentEstadoFilter = e.currentTarget.getAttribute('data-estado');
          this.cargarIncidencias();
        });
      });

      // Initial Load
      this.cargarIncidencias();
    }
  }

  async cargarIncidencias() {
    const tblDatos = this.querySelector('#tbl-datos-supervisor');
    if (!tblDatos) return;

    tblDatos.load(async () => {
      const allIncidents = (await IncidenciaService.getAll()) || [];
      if (this.currentEstadoFilter === 'all') {
        return allIncidents;
      }
      const filterId = parseInt(this.currentEstadoFilter);
      return allIncidents.filter((inc) => inc.estado_id === filterId);
    });
  }

  async despacharIncidencia(inc) {
    if (!confirm(`¿Está seguro de que desea despachar la incidencia #${inc.id}?`)) {
      return;
    }

    try {
      // 1. Fetch exact details to get current version
      const current = await IncidenciaService.getById(inc.id);

      // Auto-assign institution if not set
      let finalInstitucionId = current.institucion_id;
      if (!finalInstitucionId && current.sub_tipo_incidencia_id) {
        const subcat = this.categorias.find((c) => c.id == current.sub_tipo_incidencia_id);
        if (subcat && subcat.institucion_id) {
          finalInstitucionId = subcat.institucion_id;
        }
      }

      // 2. Prepare payload to transition state to 'En Proceso' (4)
      const payload = {
        incidencia_descripcion: current.incidencia_descripcion,
        direccion_id: current.direccion_id,
        tipo_incidencia_id: current.tipo_incidencia_id,
        sub_tipo_incidencia_id: current.sub_tipo_incidencia_id,
        cantidad_afectados_incidencia: current.cantidad_afectados_incidencia,
        institucion_id: finalInstitucionId,
        estado_id: 4, // En Proceso
        version: current.version,
      };

      await IncidenciaService.update(inc.id, payload);
      this.mostrarAlertaExito(`Incidencia #${inc.id} despachada con éxito.`);
      this.cargarIncidencias();
    } catch (error) {
      console.error('Error al despachar incidencia:', error);
      this.mostrarAlertaError(`Error al despachar: ${error.message || error}`);
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
      setTimeout(() => errorAlert.classList.add('d-none'), 4000);
    }
  }
}

customElements.define('app-incidencia-supervisor-index', IncidenciaSupervisorIndexComponent);
