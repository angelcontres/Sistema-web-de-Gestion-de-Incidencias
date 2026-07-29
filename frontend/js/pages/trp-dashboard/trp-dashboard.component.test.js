import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../core/api.js', () => ({
  apiRequest: jest.fn(),
  API_BASE_URL: 'http://localhost/api',
}));

const TRP_TEMPLATE =
  '<div class="page-fade-in">' +
  '<div class="row mb-4">' +
  '<div class="col-12">' +
  '<div class="premium-card">' +
  '<div class="premium-card-header mb-0 border-bottom pb-3">' +
  '<h5 class="premium-card-title text-primary"><i class="bi bi-graph-up-arrow me-2"></i> TRP Promedio a lo largo del tiempo (24h)</h5>' +
  '<div class="dropdown">' +
  '<button class="btn btn-primary btn-sm dropdown-toggle rounded-pill px-3 shadow-sm fw-semibold" type="button" id="exportDropdown" data-bs-toggle="dropdown" aria-expanded="false">' +
  '<i class="bi bi-download me-1"></i> Exportar Logs' +
  '</button>' +
  '<ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 custom-dropdown" aria-labelledby="exportDropdown">' +
  '<li><a class="dropdown-item py-2" href="#" id="btnExportCsv"><i class="bi bi-file-earmark-spreadsheet me-2 text-success"></i>Como CSV</a></li>' +
  '<li><a class="dropdown-item py-2" href="#" id="btnExportTxt"><i class="bi bi-file-earmark-text me-2 text-secondary"></i>Como TXT</a></li>' +
  '</ul>' +
  '</div>' +
  '</div>' +
  '<div class="card-body pt-4 px-0 pb-0">' +
  '<canvas id="trpChart" height="100"></canvas>' +
  '</div>' +
  '</div>' +
  '</div>' +
  '</div>' +
  '<div class="row">' +
  '<div class="col-12">' +
  '<div class="premium-table-wrapper">' +
  '<div class="premium-card-header bg-white px-4 pt-4 pb-3 mb-0 border-bottom">' +
  '<h5 class="premium-card-title text-danger"><i class="bi bi-exclamation-triangle-fill me-2"></i> Top 5 Endpoints m&aacute;s lentos</h5>' +
  '</div>' +
  '<div class="table-responsive">' +
  '<table class="table premium-table table-hover mb-0">' +
  '<thead>' +
  '<tr>' +
  '<th class="ps-4">Endpoint</th>' +
  '<th>M&eacute;todo</th>' +
  '<th>Promedio (ms)</th>' +
  '<th>M&aacute;ximo (ms)</th>' +
  '<th>Total Peticiones</th>' +
  '</tr>' +
  '</thead>' +
  '<tbody id="slowestEndpointsTable">' +
  '<tr><td colspan="5" class="text-center py-5 text-muted fw-medium">Cargando...</td></tr>' +
  '</tbody>' +
  '</table>' +
  '</div>' +
  '</div>' +
  '</div>' +
  '</div>' +
  '</div>';

const MOCK_TIMELINE = [
  { hour: '2025-01-01T08:00:00Z', avg_trp: 120 },
  { hour: '2025-01-01T09:00:00Z', avg_trp: 95 },
  { hour: '2025-01-01T10:00:00Z', avg_trp: 150 },
];

const MOCK_SLOWEST = [
  { endpoint: '/api/test', metodo: 'GET', avg_trp: 500, max_trp: 1000, total_requests: 50 },
  { endpoint: '/api/data', metodo: 'POST', avg_trp: 300, max_trp: 600, total_requests: 30 },
];

describe('TrpDashboardComponent', () => {
  let apiRequest, TrpDashboardComponent;

  beforeAll(async () => {
    const apiMod = await import('../../core/api.js');
    apiRequest = apiMod.apiRequest;
    const mod = await import('./trp-dashboard.component.js');
    TrpDashboardComponent = mod.TrpDashboardComponent;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.Chart = jest.fn();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    delete global.fetch;
    delete window.Chart;
    document.body.innerHTML = '';
  });

  it('se define como custom element app-trp-dashboard', () => {
    expect(customElements.get('app-trp-dashboard')).toBe(TrpDashboardComponent);
  });

  it('onInit llama apiRequest y renderiza chart y tabla en success', async () => {
    apiRequest.mockResolvedValue({
      timeline: MOCK_TIMELINE,
      top_slowest: MOCK_SLOWEST,
    });
    const el = new TrpDashboardComponent();
    el.innerHTML = TRP_TEMPLATE;
    await el.onInit();
    expect(apiRequest).toHaveBeenCalledWith('/trp/performance-stats');
    expect(window.Chart).toHaveBeenCalledTimes(1);
    const rows = el.querySelectorAll('#slowestEndpointsTable tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].innerHTML).toContain('/api/test');
  });

  it('onInit muestra error en tabla si apiRequest falla', async () => {
    apiRequest.mockRejectedValue(new Error('Network error'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const el = new TrpDashboardComponent();
    el.innerHTML = TRP_TEMPLATE;
    await el.onInit();
    const tbody = el.querySelector('#slowestEndpointsTable');
    expect(tbody.innerHTML).toContain('Error al cargar datos');
    jest.restoreAllMocks();
  });

  it('renderChart no hace nada si ctx no existe', () => {
    const el = new TrpDashboardComponent();
    el.innerHTML = '<div></div>';
    el.renderChart(MOCK_TIMELINE);
    expect(window.Chart).not.toHaveBeenCalled();
  });

  it('renderChart muestra mensaje vacio si no hay timeline', () => {
    const el = new TrpDashboardComponent();
    el.innerHTML = '<div><canvas id="trpChart"></canvas></div>';
    el.renderChart([]);
    expect(window.Chart).not.toHaveBeenCalled();
    expect(el.innerHTML).toContain('No hay datos registrados');
  });

  it('renderChart crea instancia Chart con datos correctos', () => {
    const el = new TrpDashboardComponent();
    el.innerHTML = '<div><canvas id="trpChart"></canvas></div>';
    el.renderChart(MOCK_TIMELINE);
    expect(window.Chart).toHaveBeenCalledTimes(1);
    const [ctx, config] = window.Chart.mock.calls[0];
    expect(ctx).toBe(el.querySelector('#trpChart'));
    expect(config.data.labels).toHaveLength(3);
    expect(config.data.datasets[0].data).toEqual([120, 95, 150]);
    expect(config.type).toBe('line');
  });

  it('renderTable muestra mensaje vacio si no hay datos', () => {
    const el = new TrpDashboardComponent();
    el.innerHTML = '<table><tbody id="slowestEndpointsTable"></tbody></table>';
    el.renderTable([]);
    expect(el.querySelector('#slowestEndpointsTable').innerHTML).toContain(
      'No hay datos suficientes'
    );
  });

  it('renderTable renderiza filas para cada item', () => {
    const el = new TrpDashboardComponent();
    el.innerHTML = '<table><tbody id="slowestEndpointsTable"></tbody></table>';
    el.renderTable(MOCK_SLOWEST);
    const rows = el.querySelectorAll('#slowestEndpointsTable tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].innerHTML).toContain('/api/test');
    expect(rows[0].innerHTML).toContain('bg-success');
    expect(rows[1].innerHTML).toContain('/api/data');
    expect(rows[1].innerHTML).toContain('bg-primary');
  });

  it('getMethodColor retorna color correcto segun el metodo HTTP', () => {
    const el = new TrpDashboardComponent();
    expect(el.getMethodColor('GET')).toBe('bg-success');
    expect(el.getMethodColor('POST')).toBe('bg-primary');
    expect(el.getMethodColor('PUT')).toBe('bg-warning text-dark');
    expect(el.getMethodColor('DELETE')).toBe('bg-danger');
    expect(el.getMethodColor('PATCH')).toBe('bg-secondary');
  });

  it('setupExportButtons asigna click handlers a botones CSV y TXT', () => {
    const el = new TrpDashboardComponent();
    el.innerHTML = '<a href="#" id="btnExportCsv">CSV</a><a href="#" id="btnExportTxt">TXT</a>';
    const csvSpy = jest.spyOn(el, 'downloadLogs');
    el.setupExportButtons();
    el.querySelector('#btnExportCsv').click();
    expect(csvSpy).toHaveBeenCalledWith('csv');
    el.querySelector('#btnExportTxt').click();
    expect(csvSpy).toHaveBeenCalledWith('txt');
    csvSpy.mockRestore();
  });

  describe('downloadLogs', () => {
    let originalLocalStorageDescriptor;

    beforeEach(() => {
      originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
      const store = { access_token: 'test-token' };
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn((key) => store[key] ?? null),
        },
        writable: true,
        configurable: true,
      });
      window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      window.URL.revokeObjectURL = jest.fn();
    });

    afterEach(() => {
      if (originalLocalStorageDescriptor) {
        Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
      } else {
        delete window.localStorage;
      }
      delete window.URL.createObjectURL;
      delete window.URL.revokeObjectURL;
    });

    it('crea blob y dispara descarga para formato csv', async () => {
      const blobContent = new Blob(['col1,col2\na,b']);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(blobContent),
      });
      const el = new TrpDashboardComponent();
      const anchorEl = document.createElement('a');
      const clickSpy = jest.spyOn(anchorEl, 'click');
      jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') return anchorEl;
        return document.createElement(tag);
      });
      await el.downloadLogs('csv');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost/api/trp/performance-logs/export?format=csv',
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(blobContent);
      expect(anchorEl.download).toBe('performance_logs.csv');
      expect(clickSpy).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      jest.restoreAllMocks();
    });

    it('maneja error en fetch gracefulmente con alert', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(window, 'alert').mockImplementation(() => {});
      const el = new TrpDashboardComponent();
      await el.downloadLogs('txt');
      expect(console.error).toHaveBeenCalledWith('Error al exportar logs:', expect.any(Error));
      expect(window.alert).toHaveBeenCalledWith(
        'Ocurrió un error al intentar exportar los registros.'
      );
      jest.restoreAllMocks();
    });
  });
});
