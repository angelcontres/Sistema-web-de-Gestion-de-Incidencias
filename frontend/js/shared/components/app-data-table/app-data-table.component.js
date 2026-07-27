import { BaseComponent } from '../../../core/base-component.js';
import { apiRequest } from '../../../core/api.js';

// Helper to resolve nested object keys (e.g. 'parent.nombre')
function getNestedValue(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export class AppDataTableComponent extends BaseComponent {
  constructor() {
    super('js/shared/components/app-data-table/app-data-table.component.html');
    this.columns = [];
    this.data = [];

    this.isReady = false;
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });

    this.currentPage = 1;
    this.perPage = 15;
    this.lastPage = 1;
    this.currentEndpointOrService = null;

    // Cursor pagination support
    this.isCursorPagination = false;
    this.currentCursor = null;
    this.nextCursor = null;
    this.prevCursor = null;

    // Read page from URL hash if present
    const hashParts = window.location.hash.split('?');
    if (hashParts.length > 1) {
      const urlParams = new URLSearchParams(hashParts[1]);
      const pageParam = urlParams.get('page');
      if (pageParam && !Number.isNaN(pageParam)) {
        this.currentPage = Number.parseInt(pageParam, 10);
      }
      const perPageParam = urlParams.get('per_page');
      if (perPageParam && !Number.isNaN(perPageParam)) {
        this.perPage = Number.parseInt(perPageParam, 10);
      }
    }
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
          renderFn = (item, index) => {
            return templateStr.replace(/\$\{(.+?)\}/g, (_, path) => {
              const expr = path.trim();
              if (expr === 'index') return index;

              // Only handle simple property access on 'item', e.g., 'item.nombre' or 'item.estado.id'
              let current = null;
              if (expr === 'item') {
                current = item;
              } else if (expr.startsWith('item.')) {
                const parts = expr.split('.').slice(1);
                current = item;
                for (const part of parts) {
                  if (current == null) break;
                  current = current[part];
                }
              }
              return current != null ? current : '';
            });
          };
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

    this.paginationContainer = this.querySelector('#pagination-container');
    this.btnPrevPage = this.querySelector('#btn-prev-page');
    this.btnNextPage = this.querySelector('#btn-next-page');
    this.pageCurrentLabel = this.querySelector('#page-current');
    this.pageTotalLabel = this.querySelector('#page-total');

    if (this.btnPrevPage && this.btnNextPage) {
      this.btnPrevPage.addEventListener('click', () => {
        if (this.isCursorPagination) {
          if (this.prevCursor) {
            this.currentCursor = this.prevCursor;
            this.load(this.currentEndpointOrService);
          }
        } else if (this.currentPage > 1) {
          this.currentPage--;
          this.updateUrlAndLoad();
        }
      });
      this.btnNextPage.addEventListener('click', () => {
        if (this.isCursorPagination) {
          if (this.nextCursor) {
            this.currentCursor = this.nextCursor;
            this.load(this.currentEndpointOrService);
          }
        } else if (this.currentPage < this.lastPage) {
          this.currentPage++;
          this.updateUrlAndLoad();
        }
      });
    }

    // Render table headers dynamically if columns are already defined
    this.renderHeaders();

    this.selectPerPage = this.querySelector('#select-per-page');
    if (this.selectPerPage) {
      this.selectPerPage.value = this.perPage;
      this.selectPerPage.addEventListener('change', (e) => {
        this.perPage = Number.parseInt(e.target.value, 10);
        this.currentPage = 1;
        this.updateUrlAndLoad();
      });
    }

    // Setup action click delegation
    if (this.tbody) {
      this.tbody.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('[data-action]');
        if (actionBtn) {
          const action = actionBtn.dataset.action;
          const rowIndex = actionBtn.closest('tr').dataset.rowIndex;
          const item = this.data[rowIndex];

          if (item) {
            this.dispatchEvent(
              new CustomEvent('row-action', {
                detail: { action, item, index: Number.parseInt(rowIndex), element: actionBtn },
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
   * Helper to update browser URL silently and trigger load
   */
  updateUrlAndLoad() {
    const hashPath = window.location.hash.split('?')[0];
    const newHash = `${hashPath}?page=${this.currentPage}&per_page=${this.perPage}`;
    // Updates URL without triggering router reload
    history.replaceState(null, '', window.location.pathname + window.location.search + newHash);

    this.load(this.currentEndpointOrService);
  }

  /**
   * Automatically load data from backend endpoint
   * Handles showing spinner, counting badges, empty state, and API error formatting.
   * @param {string|Function} endpointOrService
   * @returns {Promise<void>}
   */
  async load(endpointOrService) {
    if (!endpointOrService) return;
    this.currentEndpointOrService = endpointOrService;

    await this.readyPromise;
    this._setLoadingState(true);

    try {
      const response = await this._fetchData(endpointOrService);
      const list = Array.isArray(response) ? response : response?.data || [];

      this.updatePaginationMetadata(response, list);

      this.data = list;
      this._setLoadingState(false);

      if (this.data.length === 0) {
        this.emptyState.classList.remove('d-none');
        return;
      }

      this._updateTotalBadge(response);

      this.renderRows();
      this.tableContainer.classList.remove('d-none');
    } catch (err) {
      this._handleLoadError(err);
    }
  }

  _setLoadingState(isLoading) {
    if (isLoading) {
      this.loadingSpinner.classList.remove('d-none');
      this.tableContainer.classList.add('d-none');
      this.emptyState.classList.add('d-none');
      this.errorAlert.classList.add('d-none');
      this.totalBadge.classList.add('d-none');
      if (this.paginationContainer) this.paginationContainer.classList.add('d-none');
    } else {
      this.loadingSpinner.classList.add('d-none');
    }
  }

  async _fetchData(endpointOrService) {
    if (typeof endpointOrService === 'function') {
      return await endpointOrService(this.currentPage, this.perPage, this.currentCursor);
    }
    const sep = endpointOrService.includes('?') ? '&' : '?';
    let url = `${endpointOrService}${sep}`;
    if (this.isCursorPagination && this.currentCursor) {
      url += `cursor=${this.currentCursor}&per_page=${this.perPage}`;
    } else {
      url += `page=${this.currentPage}&per_page=${this.perPage}`;
    }
    return await apiRequest(url);
  }

  _updateTotalBadge(response) {
    if (response?.total !== undefined) {
      this.totalBadge.textContent = `${response.total} Registros en total`;
    } else {
      this.totalBadge.textContent = `${this.data.length} Registros`;
    }
    this.totalBadge.classList.remove('d-none');
  }

  _handleLoadError(err) {
    console.error('Error auto-loading app-data-table:', err);
    this._setLoadingState(false);
    if (this.errorMessage) {
      this.errorMessage.textContent = err.message || 'Error al cargar registros.';
    }
    this.errorAlert.classList.remove('d-none');
  }

  updatePaginationMetadata(response, list) {
    if (response?.next_cursor !== undefined || response?.prev_cursor !== undefined) {
      this.isCursorPagination = true;
      this.nextCursor = response.next_cursor;
      this.prevCursor = response.prev_cursor;

      if (this.paginationContainer && (this.nextCursor || this.prevCursor || list.length > 0)) {
        this.paginationContainer.classList.remove('d-none');
        this.pageCurrentLabel.textContent = 'Dinámica';
        this.pageTotalLabel.textContent = 'Cursor';
        this.btnPrevPage.disabled = !this.prevCursor;
        this.btnNextPage.disabled = !this.nextCursor;
      }
    } else if (response?.current_page !== undefined) {
      this.isCursorPagination = false;
      this.currentPage = response.current_page;
      this.lastPage = response.last_page || 1;

      if (this.paginationContainer) {
        this.paginationContainer.classList.remove('d-none');
        this.pageCurrentLabel.textContent = this.currentPage;
        this.pageTotalLabel.textContent = this.lastPage;

        this.btnPrevPage.disabled = this.currentPage <= 1;
        this.btnNextPage.disabled = this.currentPage >= this.lastPage;
      }
    }
  }

  /**
   * Draw row items
   */
  renderRows() {
    if (!this.tbody) return;
    this.tbody.innerHTML = '';

    const fragment = document.createDocumentFragment();

    this.data.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.className = 'border-bottom border-light';
      tr.dataset.rowIndex = index;

      this.columns.forEach((col) => {
        const td = this._createCell(col, item, index);
        tr.appendChild(td);
      });

      fragment.appendChild(tr);
    });

    this.tbody.appendChild(fragment);
  }

  _createCell(col, item, index) {
    const td = document.createElement('td');
    if (col.class) td.className = col.class;

    if (col.actions && Array.isArray(col.actions)) {
      this._renderActions(td, col);
    } else if (col.render) {
      this._renderCustom(td, col, item, index);
    } else if (col.key) {
      this._renderKey(td, col, item);
    } else {
      td.textContent = '-';
    }

    return td;
  }

  _renderActions(td, col) {
    td.className = col.class || 'text-center';
    const actionsHtml = col.actions
      .map(
        (act) => `
      <li>
        <button class="dropdown-item d-flex align-items-center gap-2 px-3 py-2 ${act.class || ''} small fw-medium border-0 bg-transparent w-100 text-start" type="button" data-action="${act.name}">
          ${act.icon ? `<i class="bi ${act.icon}"></i>` : ''} ${act.label}
        </button>
      </li>
    `
      )
      .join('');

    td.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-light text-secondary p-1.5 rounded-2 border-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-three-dots-vertical fs-6"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
          ${actionsHtml}
        </ul>
      </div>
    `;
  }

  _renderCustom(td, col, item, index) {
    try {
      const renderResult = typeof col.render === 'function' ? col.render(item, index) : col.render;
      if (renderResult instanceof HTMLElement) {
        td.appendChild(renderResult);
      } else {
        td.innerHTML = renderResult;
      }
    } catch (err) {
      console.error('Error rendering template for row:', item, err);
      td.textContent = 'Error';
    }
  }

  _renderKey(td, col, item) {
    let val = getNestedValue(item, col.key);

    if (col.format) {
      try {
        if (typeof col.format === 'function') {
          val = col.format(val);
        } else {
          val = String(col.format).replaceAll('${value}', val);
        }
      } catch (err) {
        console.error('Error formatting value:', val, err);
      }
    }

    td.textContent = val !== undefined && val !== null ? val : '-';
  }
}

// Register the custom element
customElements.define('app-data-table', AppDataTableComponent);
