import { BaseComponent } from '../../../../core/base-component.js';

export class DashboardAdminComponent extends BaseComponent {
  constructor() {
    super('js/pages/dashboard/components/dashboard-admin/dashboard-admin.component.html');
    this.dashboardData = null;
    this.roleName = 'Admin';
  }

  onInit() {
    if (this.dashboardData) {
      this.renderData();
    }
  }

  set data(value) {
    this.dashboardData = value;
    if (this.querySelector('#val-totales')) {
      this.renderData();
    }
  }

  renderData() {
    const data = this.dashboardData;

    this.querySelector('#val-totales').textContent = data.kpis?.totales || 0;
    this.querySelector('#val-sin-asignar').textContent = data.kpis?.sin_asignar || 0;
    this.querySelector('#val-pendientes').textContent = data.kpis?.pendientes || 0;
    this.querySelector('#val-resueltas').textContent = data.kpis?.resueltas || 0;
    this.querySelector('#title-tendencia').textContent = `Tendencia Temporal (${this.roleName})`;

    if ((data.kpis?.sin_asignar || 0) > 0) {
      this.querySelector('#badge-rezagos').classList.remove('d-none');
    }

    setTimeout(() => {
      if (!window.echarts) return;

      const estadoColors = {
        Pendiente: '#94a3b8',
        'En Revisión': '#38bdf8',
        'En Proceso': '#D98A2F',
        Resuelto: '#34d399',
        Rechazado: '#f87171',
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

      const chartInstitucion = window.echarts.init(this.querySelector('#chartInstitucion'));
      const instxAxis = (data.incidencias_institucion || []).map((item) => String(item.metric));
      const instSeries = (data.incidencias_institucion || []).map((item) => Number(item.value));
      chartInstitucion.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: {
          type: 'category',
          data: instxAxis,
          axisLabel: { color: '#64748b', rotate: 15 },
          axisLine: { lineStyle: { color: '#e2e8f0' } },
        },
        yAxis: {
          type: 'value',
          name: 'Incidencias',
          nameTextStyle: { color: '#64748b' },
          axisLabel: { color: '#64748b' },
          splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } },
        },
        series: [
          {
            name: 'Incidencias',
            type: 'bar',
            barMaxWidth: 40,
            itemStyle: { color: '#0D2A4C', borderRadius: [4, 4, 0, 0] },
            data: instSeries,
          },
        ],
      });

      const chartTendencia = window.echarts.init(this.querySelector('#chartTendencia'));
      const xAxisData = (data.tendencia_temporal || []).map((item) => {
        const date = new Date(item.metric);
        return Number.isNaN(date.getTime())
          ? String(item.metric)
          : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            lineStyle: { width: 3, color: '#227A8A' },
            itemStyle: { color: '#227A8A' },
            areaStyle: {
              color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(34, 122, 138, 0.25)' },
                { offset: 1, color: 'rgba(34, 122, 138, 0)' },
              ]),
            },
            data: seriesData,
          },
        ],
      });

      window.addEventListener('resize', () => {
        chartEstado.resize();
        chartInstitucion.resize();
        chartTendencia.resize();
      });
    }, 100);
  }
}
customElements.define('app-dashboard-admin', DashboardAdminComponent);
