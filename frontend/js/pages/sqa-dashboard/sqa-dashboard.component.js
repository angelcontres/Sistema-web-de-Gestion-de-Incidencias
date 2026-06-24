import { BaseComponent } from '../../core/base-component.js';
import { apiRequest } from '../../core/api.js';

export class SqaDashboardComponent extends BaseComponent {
  constructor() {
    super('js/pages/sqa-dashboard/sqa-dashboard.component.html');
  }

  async onInit() {
    try {
      const response = await apiRequest('/sqa/performance-stats');
      const dataLogs = response || [];

      this.renderChart(dataLogs.timeline);
      this.renderTable(dataLogs.top_slowest);
    } catch (error) {
      console.error(error);
      const tbody = this.querySelector('#slowestEndpointsTable');
      if (tbody)
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Error al cargar datos.</td></tr>`;
    }
  }

  renderChart(timeline) {
    const ctx = this.querySelector('#trpChart');
    if (!ctx) return;

    if (!timeline || timeline.length === 0) {
      const cardBody = ctx.parentElement;
      cardBody.innerHTML =
        '<p class="text-center text-muted py-4">No hay datos registrados en las últimas 24 horas.</p>';
      return;
    }

    const labels = timeline.map((t) =>
      new Date(t.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const data = timeline.map((t) => t.avg_trp);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'TRP Promedio (ms)',
            data: data,
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Milisegundos (ms)' },
          },
        },
      },
    });
  }

  renderTable(slowest) {
    const tbody = this.querySelector('#slowestEndpointsTable');
    if (!tbody) return;

    if (!slowest || slowest.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center py-4 text-muted">No hay datos suficientes.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    slowest.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="ps-4"><span class="badge bg-light text-dark border">${item.endpoint}</span></td>
        <td><span class="badge ${this.getMethodColor(item.metodo)}">${item.metodo}</span></td>
        <td class="fw-bold text-danger">${item.avg_trp} ms</td>
        <td class="text-warning fw-semibold">${item.max_trp} ms</td>
        <td>${item.total_requests}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  getMethodColor(method) {
    switch (method) {
      case 'GET':
        return 'bg-success';
      case 'POST':
        return 'bg-primary';
      case 'PUT':
        return 'bg-warning text-dark';
      case 'DELETE':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
}

customElements.define('app-sqa-dashboard', SqaDashboardComponent);
