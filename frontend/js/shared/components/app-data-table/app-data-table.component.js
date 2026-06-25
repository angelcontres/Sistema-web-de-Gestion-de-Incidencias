import { BaseComponent } from '../../../core/base-component.js';
import { apiRequest } from '../../../core/api.js';

// Helper to resolve nested object keys (e.g. 'parent.nombre')
function getNestedValue(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export class AppDataTableComponent extends BaseComponent {
  constructor() {
    super('js/shared/components/app-data-table/app-data-table.component.html');
    this.columns = [];
    this.data = [];

    // Promise to handle the async template loading race condition
    this.isReady = false;
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

  async connectedCallback() {
    // 1. Extract column definitions from light DOM child nodes (if any)
    const colDefs = Array.from(this.querySelectorAll('column-def'));

    if (colDefs.length > 0) {
      this.columns = colDefs.map((col) => {
        const templateEl = col.querySelector('template');
        let renderFn = null;

        if (templateEl) {
          const templateStr = templateEl.innerHTML;
          const escapedTemplate = templateStr.replace(/`/g, '\\`');
          try {
            renderFn = new Function('item', 'index', `return \`${escapedTemplate}\`;`);
          } catch (err) {
            console.error('Error compiling column template:', col.getAttribute('header'), err);
          }
        }

        return {
          header: col.getAttribute('header') || '',
          key: col.getAttribute('key') || null,
          class: col.getAttribute('class') || '',
          format: col.getAttribute('format') || null,
          render: renderFn,
        };
      });
    }

    // 2. Fetch the HTML template and set innerHTML using BaseComponent logic
    await super.connectedCallback();
  }

  onInit() {
    // 3. Extract customization attributes from custom tag
    const title = this.getAttribute('title') || 'Lista de Registros';
    const emptyText = this.getAttribute('empty-text') || 'No se encontraron registros.';

    // 4. Cache dynamic DOM nodes
    this.tbody = this.querySelector('#tbl-data');
    this.loadingSpinner = this.querySelector('#loading-spinner');
    this.tableContainer = this.querySelector('#table-container');
    this.emptyState = this.querySelector('#empty-state');
    this.errorAlert = this.querySelector('#error-alert');
    this.errorMessage = this.querySelector('#error-message');
    this.totalBadge = this.querySelector('#total-badge');
    this.titleContainer = this.querySelector('#title-container');
    this.headerRow = this.querySelector('#table-header');

    // Apply attributes to the card
    if (this.titleContainer) this.titleContainer.textContent = title;
    if (this.emptyState) {
      const p = this.emptyState.querySelector('p');
      if (p) p.textContent = emptyText;
    }

    // Render table headers dynamically if columns are already defined
    this.renderHeaders();

    // Setup action click delegation
    if (this.tbody) {
      this.tbody.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('[data-action]');
        if (actionBtn) {
          const action = actionBtn.getAttribute('data-action');
          const rowIndex = actionBtn.closest('tr').getAttribute('data-row-index');
          const item = this.data[rowIndex];

          if (item) {
            this.dispatchEvent(
              new CustomEvent('row-action', {
                detail: { action, item, index: parseInt(rowIndex), element: actionBtn },
                bubbles: true,
                composed: true,
              })
            );
          }
        }
      });
    }

    // If initial items were set before connection/onInit, render them
    if (this.data && this.data.length > 0) {
      this.renderRows();
    }

    // 5. Signal that the template has loaded and DOM references are cached
    this.isReady = true;
    this.resolveReady();
  }

  /**
   * Programmatic configuration method to pass columns from JS
   * @param {Object} config - Config object containing { columns }
   */
  configure(config) {
    this.columns = config.columns || [];
    this.renderHeaders();
    if (this.data && this.data.length > 0) {
      this.renderRows();
    }
  }

  /**
   * Render columns headers dynamically
   */
  renderHeaders() {
    if (this.headerRow && this.columns.length > 0) {
      this.headerRow.innerHTML = this.columns
        .map(
          (col) => `
        <th class="${col.class || ''}">${col.header}</th>
      `
        )
        .join('');
    }
  }

  set items(value) {
    this.data = value || [];
    if (this.tbody) {
      this.renderRows();
    }
  }

  get items() {
    return this.data;
  }

  /**
   * Automatically load data from backend endpoint
   * Handles showing spinner, counting badges, empty state, and API error formatting.
   * @param {string} endpoint
   * @returns {Promise<void>}
   */
  async load(endpointOrService) {
    // Wait for the HTML template to load and onInit to cache references
    await this.readyPromise;

    this.loadingSpinner.classList.remove('d-none');
    this.tableContainer.classList.add('d-none');
    this.emptyState.classList.add('d-none');
    this.errorAlert.classList.add('d-none');
    this.totalBadge.classList.add('d-none');

    try {
      let response;
      if (typeof endpointOrService === 'function') {
        response = await endpointOrService();
      } else {
        response = await apiRequest(endpointOrService);
      }
      const list = Array.isArray(response) ? response : response.data || [];

      this.data = list;
      this.loadingSpinner.classList.add('d-none');

      if (this.data.length === 0) {
        this.emptyState.classList.remove('d-none');
        return;
      }

      this.totalBadge.textContent = `${this.data.length} Registros`;
      this.totalBadge.classList.remove('d-none');

      this.renderRows();
      this.tableContainer.classList.remove('d-none');
    } catch (err) {
      console.error('Error auto-loading app-data-table:', err);
      this.loadingSpinner.classList.add('d-none');
      if (this.errorMessage) {
        this.errorMessage.textContent = err.message || 'Error al cargar registros.';
      }
      this.errorAlert.classList.remove('d-none');
    }
  }

  /**
   * Draw row items
   */
  renderRows() {
    if (!this.tbody) return;
    this.tbody.innerHTML = '';

    this.data.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.className = 'border-bottom border-light';
      tr.setAttribute('data-row-index', index);

      this.columns.forEach((col) => {
        const td = document.createElement('td');
        if (col.class) {
          td.className = col.class;
        }

        // Render actions block if array is specified
        if (col.actions && Array.isArray(col.actions)) {
          td.className = col.class || 'text-center';
          td.innerHTML = `
            <div class="dropdown">
              <button class="btn btn-light text-secondary p-1.5 rounded-2 border-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-three-dots-vertical fs-6"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                ${col.actions
                  .map(
                    (act) => `
                  <li>
                    <button class="dropdown-item d-flex align-items-center gap-2 px-3 py-2 ${act.class || ''} small fw-medium border-0 bg-transparent w-100 text-start" type="button" data-action="${act.name}">
                      ${act.icon ? `<i class="bi ${act.icon}"></i>` : ''} ${act.label}
                    </button>
                  </li>
                `
                  )
                  .join('')}
              </ul>
            </div>
          `;
        }
        // Render custom JS callback
        else if (col.render && typeof col.render === 'function') {
          try {
            const renderResult = col.render(item, index);
            if (renderResult instanceof HTMLElement) {
              td.appendChild(renderResult);
            } else {
              td.innerHTML = renderResult;
            }
          } catch (err) {
            console.error('Error rendering template callback for row:', item, err);
            td.textContent = 'Error';
          }
        }
        // Render compiled ES6 dynamic template function (from connected HTML slots)
        else if (col.render) {
          try {
            td.innerHTML = col.render(item, index);
          } catch (err) {
            console.error('Error rendering template for row:', item, err);
            td.textContent = 'Error';
          }
        }
        // Render standard key text
        else if (col.key) {
          let val = getNestedValue(item, col.key);

          if (col.format) {
            try {
              if (typeof col.format === 'function') {
                val = col.format(val);
              } else {
                const formatFn = new Function('value', `return \`${col.format}\`;`);
                val = formatFn(val);
              }
            } catch (err) {
              console.error('Error formatting value:', val, err);
            }
          }

          td.textContent = val !== undefined && val !== null ? val : '-';
        } else {
          td.textContent = '-';
        }

        tr.appendChild(td);
      });

      this.tbody.appendChild(tr);
    });
  }
}

// Register the custom element
customElements.define('app-data-table', AppDataTableComponent);
