import { BaseComponent } from '../../../../core/base-component.js';

export class DashboardCiudadanoComponent extends BaseComponent {
  constructor() {
    super('js/pages/dashboard/components/dashboard-ciudadano/dashboard-ciudadano.component.html');
    this.dashboardData = null;
  }

  onInit() {
    if (this.dashboardData) {
      this.renderData();
    }
  }

  set data(value) {
    this.dashboardData = value;
    if (this.querySelector('#val-mis-reportes')) {
      this.renderData();
    }
  }

  renderData() {
    const data = this.dashboardData;

    this.querySelector('#val-mis-reportes').textContent = data.kpis?.mis_reportes || 0;
    this.querySelector('#val-solucionados').textContent = data.kpis?.solucionados || 0;

    setTimeout(() => {
      if (!window.echarts) return;

      const estadoColors = {
        Pendiente: '#94a3b8',
        'En Revisión': '#38bdf8',
        'En Proceso': '#D98A2F',
        Resuelto: '#34d399',
        Rechazado: '#f87171',
      };
      const prioridadColors = {
        Urgente: '#ef4444',
        Alta: '#f97316',
        Media: '#eab308',
        Baja: '#D98A2F',
      };

      const chartEstado = window.echarts.init(this.querySelector('#chartEstado'));
      const rawEstadoData = data.distribucion_estado || [];
      // Object.values() convierte un objeto {"0": {...}} a arreglo, y si ya es arreglo lo deja igual.
      const estadoData = Object.values(rawEstadoData).map((item) => ({
        name: String(item.metric),
        value: Number(item.value),
        itemStyle: { color: estadoColors[item.metric] || '#cbd5e1' },
      }));
      chartEstado.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'horizontal', bottom: '0%', textStyle: { color: '#64748b' } },
        series: [
          {
            name: 'Estado',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
            label: { show: estadoData.length > 0, formatter: '{b}: {c}', color: '#64748b' },
            data: estadoData.length
              ? estadoData
              : [{ name: 'Sin datos', value: 0, itemStyle: { color: '#e2e8f0' } }],
          },
        ],
      });

      const chartPrioridad = window.echarts.init(this.querySelector('#chartPrioridad'));
      const prioridadData = (data.distribucion_prioridad || []).map((item) => ({
        name: String(item.metric),
        value: Number(item.value),
        itemStyle: { color: prioridadColors[item.metric] || '#cbd5e1' },
      }));
      chartPrioridad.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', left: 'left', textStyle: { color: '#64748b' } },
        series: [
          {
            name: 'Prioridad',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
            label: { show: prioridadData.length > 0, formatter: '{b}: {c}', color: '#64748b' },
            data: prioridadData.length
              ? prioridadData
              : [{ name: 'Sin datos', value: 0, itemStyle: { color: '#e2e8f0' } }],
          },
        ],
      });

      const chartTendencia = window.echarts.init(this.querySelector('#chartTendencia'));
      const xAxisData = (data.tendencia_temporal || []).map((item) => {
        const date = new Date(item.metric);
        return isNaN(date.getTime()) ? String(item.metric) : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      });
      const seriesData = (data.tendencia_temporal || []).map((item) => Number(item.value));
      chartTendencia.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
        grid: { left: '4%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: {
          type: 'category',
          data: xAxisData,
          axisLabel: { color: '#64748b' },
          axisLine: { lineStyle: { color: '#e2e8f0' } },
        },
        yAxis: {
          type: 'value',
          name: 'Reportes',
          nameTextStyle: { color: '#64748b' },
          axisLabel: { color: '#64748b' },
          splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } },
        },
        series: [
          {
            name: 'Reportes',
            type: 'line',
            smooth: true,
            symbolSize: 8,
            lineStyle: { width: 3, color: '#D98A2F' },
            itemStyle: { color: '#D98A2F' },
            areaStyle: {
              color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0)' },
              ]),
            },
            data: seriesData,
          },
        ],
      });

      window.addEventListener('resize', () => {
        chartEstado.resize();
        chartPrioridad.resize();
        chartTendencia.resize();
      });
    }, 100);
  }
}
customElements.define('app-dashboard-ciudadano', DashboardCiudadanoComponent);
