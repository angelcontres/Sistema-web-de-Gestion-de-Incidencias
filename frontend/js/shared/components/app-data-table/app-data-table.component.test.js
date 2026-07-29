import { jest, describe, it, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../../core/api.js', () => ({
  apiRequest: jest.fn(),
  API_BASE_URL: 'http://test/api',
}));

describe('AppDataTableComponent', () => {
  let fetchMock;
  let apiRequestMock;

  const TABLE_TEMPLATE = `
    <div>
      <div id="title-container">Lista</div>
      <table>
        <thead><tr id="table-header"></tr></thead>
        <tbody id="tbl-data"></tbody>
      </table>
      <div id="loading-spinner" class="d-none">Cargando...</div>
      <div id="table-container" class="d-none">Tabla</div>
      <div id="empty-state" class="d-none"><p>No se encontraron registros.</p></div>
      <div id="error-alert" class="d-none"><span id="error-message"></span></div>
      <span id="total-badge" class="d-none"></span>
      <div id="pagination-container" class="d-none">
        <button id="btn-prev-page">Anterior</button>
        <span id="page-current">1</span>/<span id="page-total">1</span>
        <button id="btn-next-page">Siguiente</button>
      </div>
      <select id="select-per-page">
        <option value="15">15</option>
        <option value="30">30</option>
      </select>
    </div>
  `;

  beforeAll(async () => {
    await import('./app-data-table.component.js');
    const { apiRequest } = await import('../../../core/api.js');
    apiRequestMock = apiRequest;
  });

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    document.body.innerHTML = '';
    window.location.hash = '';
    apiRequestMock.mockReset();
  });

  afterEach(() => {
    delete global.fetch;
    window.location.hash = '';
  });

  function createElement() {
    const el = document.createElement('app-data-table');
    document.body.appendChild(el);
    return el;
  }

  async function waitLoad() {
    for (let i = 0; i < 10; i++) await new Promise(process.nextTick);
  }

  it('creates element with default values', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();
    expect(el.isReady).toBe(true);
    expect(el.columns).toEqual([]);
    expect(el.data).toEqual([]);
    expect(el.currentPage).toBe(1);
    expect(el.perPage).toBe(15);
    document.body.removeChild(el);
  });

  it('reads page and per_page from URL hash', async () => {
    window.location.hash = '#/test?page=3&per_page=30';
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();
    expect(el.currentPage).toBe(3);
    expect(el.perPage).toBe(30);
    document.body.removeChild(el);
  });

  it('sets title and empty text from attributes', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = document.createElement('app-data-table');
    el.setAttribute('title', 'Mi Tabla');
    el.setAttribute('empty-text', 'Sin datos');
    document.body.appendChild(el);
    await waitLoad();

    expect(el.querySelector('#title-container').textContent).toBe('Mi Tabla');
    expect(el.querySelector('#empty-state p').textContent).toBe('Sin datos');
    document.body.removeChild(el);
  });

  it('configure sets columns and renders headers', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({
      columns: [
        { header: 'Nombre', key: 'name' },
        { header: 'Edad', key: 'age' },
      ],
    });

    const headers = el.querySelector('#table-header').querySelectorAll('th');
    expect(headers).toHaveLength(2);
    expect(headers[0].textContent).toBe('Nombre');
    expect(headers[1].textContent).toBe('Edad');
    document.body.removeChild(el);
  });

  it('load renders rows from function service', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({
      columns: [
        { header: 'Nombre', key: 'name' },
        { header: 'Edad', key: 'age' },
      ],
    });

    const serviceFn = jest.fn().mockResolvedValue([
      { name: 'Ana', age: 25 },
      { name: 'Bob', age: 30 },
    ]);

    await el.load(serviceFn);
    expect(serviceFn).toHaveBeenCalledWith(1, 15, null);

    const rows = el.querySelector('#tbl-data').querySelectorAll('tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Ana');
    expect(rows[1].textContent).toContain('Bob');
    document.body.removeChild(el);
  });

  it('load shows empty state when no data', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({ columns: [{ header: 'Nombre', key: 'name' }] });
    await el.load(jest.fn().mockResolvedValue([]));

    expect(el.emptyState.classList.contains('d-none')).toBe(false);
    document.body.removeChild(el);
  });

  it('load shows error alert on failure', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    jest.spyOn(console, 'error').mockImplementation(() => {});
    await el.load(jest.fn().mockRejectedValue(new Error('Network error')));
    expect(el.errorAlert.classList.contains('d-none')).toBe(false);
    expect(el.errorMessage.textContent).toBe('Network error');
    console.error.mockRestore();
    document.body.removeChild(el);
  });

  it('renders custom column with template', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({
      columns: [
        {
          header: 'Nombre',
          render: (item) => `<strong>${item.name}</strong>`,
        },
      ],
    });

    el.items = [{ name: 'Carlos' }];
    const cell = el.querySelector('#tbl-data tr td');
    expect(cell.innerHTML).toBe('<strong>Carlos</strong>');
    document.body.removeChild(el);
  });

  it('dispatches row-action event on action click', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    const actionHandler = jest.fn();
    el.addEventListener('row-action', actionHandler);

    el.configure({
      columns: [
        {
          header: 'Acciones',
          actions: [{ name: 'edit', icon: 'bi-pencil', label: 'Editar', class: '' }],
        },
      ],
    });

    el.items = [{ id: 1 }];
    await waitLoad();

    const actionBtn = el.querySelector('[data-action="edit"]');
    actionBtn.click();

    expect(actionHandler).toHaveBeenCalled();
    expect(actionHandler.mock.calls[0][0].detail.action).toBe('edit');
    expect(actionHandler.mock.calls[0][0].detail.item).toEqual({ id: 1 });
    document.body.removeChild(el);
  });

  it('pagination next page calls updateUrlAndLoad', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({ columns: [{ header: 'N', key: 'n' }] });
    await el.load(
      jest.fn().mockResolvedValue({
        data: [{ n: 1 }],
        current_page: 1,
        last_page: 3,
      })
    );

    el.btnNextPage.click();
    expect(el.currentPage).toBe(2);
    document.body.removeChild(el);
  });

  it('sets items via setter and renders rows', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({ columns: [{ header: 'Valor', key: 'val' }] });
    el.items = [{ val: 'X' }, { val: 'Y' }];

    const rows = el.querySelector('#tbl-data').querySelectorAll('tr');
    expect(rows).toHaveLength(2);
    document.body.removeChild(el);
  });

  it('updatePaginationMetadata handles cursor pagination', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.updatePaginationMetadata({ next_cursor: 'abc', prev_cursor: null }, [{ id: 1 }]);

    expect(el.isCursorPagination).toBe(true);
    expect(el.nextCursor).toBe('abc');
    expect(el.prevCursor).toBeNull();
    expect(el.btnPrevPage.disabled).toBe(true);
    expect(el.btnNextPage.disabled).toBe(false);
    document.body.removeChild(el);
  });

  it('updatePaginationMetadata handles numbered pagination', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.updatePaginationMetadata({ current_page: 2, last_page: 5, data: [{}] }, [{}]);

    expect(el.isCursorPagination).toBe(false);
    expect(el.currentPage).toBe(2);
    expect(el.lastPage).toBe(5);
    expect(el.pageCurrentLabel.textContent).toBe('2');
    expect(el.pageTotalLabel.textContent).toBe('5');
    document.body.removeChild(el);
  });

  it('format function transforms cell value', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({
      columns: [
        {
          header: 'Monto',
          key: 'amount',
          format: (val) => `$${val.toFixed(2)}`,
        },
      ],
    });

    el.items = [{ amount: 100 }];
    const cell = el.querySelector('#tbl-data tr td');
    expect(cell.textContent).toBe('$100.00');
    document.body.removeChild(el);
  });

  it('nested key resolves deep property', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({
      columns: [{ header: 'Ciudad', key: 'direccion.ciudad.nombre' }],
    });

    el.items = [{ direccion: { ciudad: { nombre: 'Lima' } } }];
    const cell = el.querySelector('#tbl-data tr td');
    expect(cell.textContent).toBe('Lima');
    document.body.removeChild(el);
  });

  it('renders dash for missing key', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({ columns: [{ header: 'X', key: 'missing' }] });
    el.items = [{ id: 1 }];

    const cell = el.querySelector('#tbl-data tr td');
    expect(cell.textContent).toBe('-');
    document.body.removeChild(el);
  });

  it('select-per-page change reloads', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    const serviceFn = jest.fn().mockResolvedValue([]);
    el.configure({ columns: [{ header: 'N', key: 'n' }] });
    el.load(serviceFn);

    el.querySelector('#select-per-page').value = '30';
    el.querySelector('#select-per-page').dispatchEvent(new Event('change'));

    expect(el.perPage).toBe(30);
    expect(el.currentPage).toBe(1);
    document.body.removeChild(el);
  });

  it('parses column-def children with template', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = document.createElement('app-data-table');
    el.innerHTML = `
      <column-def header="Nombre" key="name" class="text-start">
        <template>\${item.name}</template>
      </column-def>
      <column-def header="Valor" key="val" class="text-end"></column-def>
    `;
    document.body.appendChild(el);
    await waitLoad();

    expect(el.columns).toHaveLength(2);
    expect(el.columns[0].header).toBe('Nombre');
    expect(el.columns[0].key).toBe('name');
    expect(el.columns[0].class).toBe('text-start');
    expect(typeof el.columns[0].render).toBe('function');
    expect(el.columns[1].header).toBe('Valor');
    expect(el.columns[1].key).toBe('val');
    expect(el.columns[1].class).toBe('text-end');
    expect(el.columns[1].render).toBeNull();

    const rendered = el.columns[0].render({ name: 'Alice' }, 0);
    expect(rendered).toBe('Alice');
    document.body.removeChild(el);
  });

  it('parses column-def with index expression in template', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = document.createElement('app-data-table');
    el.innerHTML = `
      <column-def header="#" key="idx" class="text-center">
        <template>#\${index}</template>
      </column-def>
    `;
    document.body.appendChild(el);
    await waitLoad();

    const rendered = el.columns[0].render({ name: 'x' }, 5);
    expect(rendered).toBe('#5');
    document.body.removeChild(el);
  });

  it('parses column-def with item expression as whole object', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = document.createElement('app-data-table');
    el.innerHTML = `
      <column-def header="Obj" key="obj">
        <template>\${item}</template>
      </column-def>
    `;
    document.body.appendChild(el);
    await waitLoad();

    const rendered = el.columns[0].render({ name: 'Test', id: 99 }, 0);
    expect(rendered).toBe('[object Object]');
    document.body.removeChild(el);
  });

  it('parses column-def with nested item expression in template', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = document.createElement('app-data-table');
    el.innerHTML = `
      <column-def header="Ciudad" key="dir.ciudad">
        <template>\${item.dir.ciudad.nombre}</template>
      </column-def>
    `;
    document.body.appendChild(el);
    await waitLoad();

    const rendered = el.columns[0].render({ dir: { ciudad: { nombre: 'Lima' } } }, 0);
    expect(rendered).toBe('Lima');
    document.body.removeChild(el);
  });

  it('parses column-def with expression that evaluates to null', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = document.createElement('app-data-table');
    el.innerHTML = `
      <column-def header="Missing" key="missing">
        <template>\${item.missing.deep.path}</template>
      </column-def>
    `;
    document.body.appendChild(el);
    await waitLoad();

    const rendered = el.columns[0].render({ name: 'x' }, 0);
    expect(rendered).toBe('');
    document.body.removeChild(el);
  });

  it('prev page navigates to previous page', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({ columns: [{ header: 'N', key: 'n' }] });
    await el.load(
      jest.fn().mockResolvedValue({
        data: [{ n: 1 }],
        current_page: 2,
        last_page: 3,
      })
    );

    expect(el.currentPage).toBe(2);
    el.btnPrevPage.click();
    expect(el.currentPage).toBe(1);
    document.body.removeChild(el);
  });

  it('prev page does nothing when at first page', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({ columns: [{ header: 'N', key: 'n' }] });
    await el.load(
      jest.fn().mockResolvedValue({
        data: [{ n: 1 }],
        current_page: 1,
        last_page: 3,
      })
    );

    el.btnPrevPage.click();
    expect(el.currentPage).toBe(1);
    document.body.removeChild(el);
  });

  it('prev page navigates with cursor pagination', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.currentEndpointOrService = jest.fn().mockResolvedValue([]);
    el.isCursorPagination = true;
    el.prevCursor = 'prev_cursor_val';
    el.btnPrevPage.disabled = false;

    const loadSpy = jest.spyOn(el, 'load').mockResolvedValue(undefined);

    el.btnPrevPage.click();
    expect(el.currentCursor).toBe('prev_cursor_val');
    expect(loadSpy).toHaveBeenCalledWith(el.currentEndpointOrService);

    loadSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('prev page with cursor pagination does nothing when no prevCursor', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.isCursorPagination = true;
    el.prevCursor = null;
    el.currentCursor = 'initial';

    el.btnPrevPage.click();
    expect(el.currentCursor).toBe('initial');
    document.body.removeChild(el);
  });

  it('next page navigates with cursor pagination', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.currentEndpointOrService = jest.fn().mockResolvedValue([]);
    el.isCursorPagination = true;
    el.nextCursor = 'next_cursor_val';
    el.btnNextPage.disabled = false;

    const loadSpy = jest.spyOn(el, 'load').mockResolvedValue(undefined);

    el.btnNextPage.click();
    expect(el.currentCursor).toBe('next_cursor_val');
    expect(loadSpy).toHaveBeenCalledWith(el.currentEndpointOrService);

    loadSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('next page with cursor pagination does nothing when no nextCursor', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.isCursorPagination = true;
    el.nextCursor = null;
    el.currentCursor = 'initial';

    el.btnNextPage.click();
    expect(el.currentCursor).toBe('initial');
    document.body.removeChild(el);
  });

  it('renders rows when data set before onInit', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = document.createElement('app-data-table');
    el.data = [{ val: 'pre' }];
    el.setAttribute('title', 'Pre');
    el.innerHTML = `<column-def header="Pre" key="val"></column-def>`;
    document.body.appendChild(el);
    await waitLoad();

    const rows = el.querySelector('#tbl-data').querySelectorAll('tr');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('pre');
    document.body.removeChild(el);
  });

  it('renders rows when configure called with existing data', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.data = [{ val: 'X' }];
    el.configure({ columns: [{ header: 'Val', key: 'val' }] });

    const rows = el.querySelector('#tbl-data').querySelectorAll('tr');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('X');
    document.body.removeChild(el);
  });

  it('get items returns data array', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.data = [{ a: 1 }, { b: 2 }];
    expect(el.items).toEqual([{ a: 1 }, { b: 2 }]);
    document.body.removeChild(el);
  });

  it('load fetches from URL endpoint adding page params', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({ columns: [{ header: 'N', key: 'n' }] });
    apiRequestMock.mockResolvedValue({
      data: [{ n: 10 }],
      total: 1,
      current_page: 1,
      last_page: 1,
    });

    await el.load('/api/test');
    expect(apiRequestMock).toHaveBeenCalledWith('/api/test?page=1&per_page=15');
    const cell = el.querySelector('#tbl-data tr td');
    expect(cell.textContent).toBe('10');
    document.body.removeChild(el);
  });

  it('load fetches from URL with existing query params', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({ columns: [{ header: 'N', key: 'n' }] });
    apiRequestMock.mockResolvedValue({ data: [{ n: 1 }] });

    await el.load('/api/test?type=admin');
    expect(apiRequestMock).toHaveBeenCalledWith('/api/test?type=admin&page=1&per_page=15');
    document.body.removeChild(el);
  });

  it('load fetches from URL with cursor pagination', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({ columns: [{ header: 'N', key: 'n' }] });
    el.isCursorPagination = true;
    el.currentCursor = 'cursor1';

    apiRequestMock.mockResolvedValue({
      data: [{ n: 20 }],
      next_cursor: 'cursor2',
      prev_cursor: null,
    });

    await el.load('/api/items');
    expect(apiRequestMock).toHaveBeenCalledWith('/api/items?cursor=cursor1&per_page=15');
    document.body.removeChild(el);
  });

  it('load does nothing when endpoint is null', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    await el.load(null);
    expect(apiRequestMock).not.toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('shows total badge with response total', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({ columns: [{ header: 'N', key: 'n' }] });
    await el.load(
      jest.fn().mockResolvedValue({
        data: [{ n: 1 }],
        total: 42,
        current_page: 1,
        last_page: 1,
      })
    );

    expect(el.totalBadge.textContent).toBe('42 Registros en total');
    expect(el.totalBadge.classList.contains('d-none')).toBe(false);
    document.body.removeChild(el);
  });

  it('renders dash for column with no key render or actions', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({
      columns: [{ header: 'Empty', class: 'text-center' }],
    });

    el.items = [{ id: 1 }];
    const cell = el.querySelector('#tbl-data tr td');
    expect(cell.textContent).toBe('-');
    document.body.removeChild(el);
  });

  it('renderCustom appends HTMLElement', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({
      columns: [
        {
          header: 'Custom',
          render: () => {
            const span = document.createElement('span');
            span.textContent = 'DOM element';
            span.className = 'custom-el';
            return span;
          },
        },
      ],
    });

    el.items = [{ id: 1 }];
    const cell = el.querySelector('#tbl-data tr td');
    const span = cell.querySelector('span.custom-el');
    expect(span).not.toBeNull();
    expect(span.textContent).toBe('DOM element');
    document.body.removeChild(el);
  });

  it('renderCustom handles render error', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    jest.spyOn(console, 'error').mockImplementation(() => {});

    el.configure({
      columns: [
        {
          header: 'Error',
          render: () => {
            throw new Error('Render fail');
          },
        },
      ],
    });

    el.items = [{ id: 1 }];
    const cell = el.querySelector('#tbl-data tr td');
    expect(cell.textContent).toBe('Error');
    console.error.mockRestore();
    document.body.removeChild(el);
  });

  it('renderKey applies string format', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({
      columns: [
        {
          header: 'Code',
          key: 'code',
          format: 'ID-${value}',
        },
      ],
    });

    el.items = [{ code: '123' }];
    const cell = el.querySelector('#tbl-data tr td');
    expect(cell.textContent).toBe('ID-123');
    document.body.removeChild(el);
  });

  it('renderKey handles format function error', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    jest.spyOn(console, 'error').mockImplementation(() => {});

    el.configure({
      columns: [
        {
          header: 'Error',
          key: 'val',
          format: () => {
            throw new Error('Format error');
          },
        },
      ],
    });

    el.items = [{ val: 'data' }];
    const cell = el.querySelector('#tbl-data tr td');
    expect(cell.textContent).toBe('data');
    console.error.mockRestore();
    document.body.removeChild(el);
  });

  it('renderKey applies function format', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    const el = createElement();
    await waitLoad();

    el.configure({
      columns: [
        {
          header: 'Price',
          key: 'price',
          format: (v) => `$${v}`,
        },
      ],
    });

    el.items = [{ price: 99 }];
    const cell = el.querySelector('#tbl-data tr td');
    expect(cell.textContent).toBe('$99');
    document.body.removeChild(el);
  });

  it('updateUrlAndLoad updates hash and calls load', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TABLE_TEMPLATE });
    window.location.hash = '#/test';
    const el = createElement();
    await waitLoad();

    el.configure({ columns: [{ header: 'N', key: 'n' }] });
    el.currentEndpointOrService = jest.fn().mockResolvedValue({ data: [{ n: 1 }] });
    el.currentPage = 2;

    await el.updateUrlAndLoad();
    expect(el.currentEndpointOrService).toHaveBeenCalled();
    document.body.removeChild(el);
  });
});
