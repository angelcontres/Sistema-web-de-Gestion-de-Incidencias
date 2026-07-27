import { BaseComponent } from '../../../../core/base-component.js';
import { IncidenciaService } from '../../services/incidencia.service.js';
import { getSoftClass } from '../../../../shared/utils/badge-states.js';

export class HistorialIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/incidencias/components/historial/historial-index.component.html');
  }

  async onInit() {
    const tblDatos = this.querySelector('#tbl-historial-incidencias');

    if (tblDatos) {
      tblDatos.configure({
        columns: [
          {
            header: 'Clasificación',
            render: (inc) => {
              const tipo = inc.tipo ? inc.tipo.nombre : '-';
              const sub_tipo = inc.sub_tipo ? inc.sub_tipo.nombre : '-';
              const subTipo = inc.subTipo ? inc.subTipo.nombre : sub_tipo;
              return `<div class="fw-semibold text-dark">${tipo}</div><div class="text-muted small">${subTipo}</div>`;
            },
          },
          {
            header: 'Descripción',
            render: (inc) =>
              `<div class="text-truncate" style="max-width: 250px;" title="${inc.incidencia_descripcion || ''}">${inc.incidencia_descripcion || 'Sin descripción.'}</div>`,
          },
          {
            header: 'Ubicación',
            render: (inc) => {
              // Si inc.direccion no existe, el ?? asigna el valor por defecto de forma segura
              const detalle = inc.direccion?.detalle ?? 'Sin dirección.';

              // Navega de forma segura por toda la estructura anidada; si algo falla, devuelve ""
              const pais = inc.direccion?.territorio?.pais?.nombre ?? '';
              return `<div>${detalle}</div><div class="text-muted small">${pais}</div>`;
            },
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
                const softClass = getSoftClass(inc.estado);
                return `<span class="badge border ${softClass} rounded-pill px-2.5 py-1 small fw-semibold">
                  ${inc.estado.nombre}
                </span>`;
              }
              return '-';
            },
          },
          {
            header: 'Detalle cronológico',
            class: 'text-center pe-4',
            render: (inc) => {
              return `<button class="btn btn-link text-primary p-0 border-0" data-action="detalle" title="Ver Detalle Cronológico">
                <i class="bi bi-search fs-5"></i>
              </button>`;
            },
          },
        ],
      });

      tblDatos.addEventListener('row-action', (e) => {
        const { action, item } = e.detail;
        if (action === 'detalle') {
          window.location.hash = `#/tramites/estado-individual?id=${item.id}`;
        }
      });

      tblDatos.load(IncidenciaService.getAll);
    }
  }
}

customElements.define('app-historial-index', HistorialIndexComponent);
