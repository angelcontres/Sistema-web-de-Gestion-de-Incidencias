# Consultas SQL y Configuración con Business Charts (Apache ECharts) en Grafana

Este documento contiene las consultas SQL y las configuraciones de **Business Charts (Apache ECharts de Volkov Labs)** para el esquema analítico (`metrics`). Apache ECharts permite construir gráficos dinámicos y premium usando código JavaScript personalizado.

---

## 1. KPIs Generales y de Negocio (Panel: Incidencias)

Para tarjetas unitarias (KPIs A, B, C y D) se recomienda usar el **Business Card** o **Stat Panel** nativo. Para gráficos de distribución y jerarquías, usaremos **Business Charts (Apache ECharts)**.

### A. Incidencias Activas / En Curso

```sql
SELECT COUNT(*) as value FROM metrics.fact_incidencias f
JOIN metrics.dim_estado e ON f.estado_id = e.id
WHERE e.nombre IN ('En Proceso', 'En Revisión');
```

- **Panel:** **Stat Panel** o **Business Card**.

---

### B. Incidencias por Provincia (ECharts Bar/Donut)

```sql
SELECT
  t.provincia as metric,
  SUM(f.cantidad) as value
FROM metrics.fact_incidencias f
JOIN metrics.dim_territorio t ON f.territorio_id = t.id
WHERE t.provincia != 'N/A'
GROUP BY t.provincia
ORDER BY value DESC;
```

- **Panel:** **Business Charts (Apache ECharts)**.
- **JavaScript Code (ECharts Config):**

```javascript
// Obtener datos del query
const series = data.series[0];
const metrics = series.fields.find((f) => f.name === "metric").values;
const values = series.fields.find((f) => f.name === "value").values;

const chartData = metrics.map((m, idx) => ({
  name: m,
  value: values[idx],
}));

return {
  tooltip: {
    trigger: "item",
    formatter: "{b}: {c} ({d}%)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "#3b82f6",
    borderWidth: 1,
    textStyle: { color: "#1e293b" },
  },
  legend: {
    orient: "vertical",
    left: "left",
    textStyle: { color: "#64748b" },
  },
  series: [
    {
      name: "Provincia",
      type: "pie",
      radius: ["40%", "70%"],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: "#fff",
        borderWidth: 2,
      },
      label: {
        show: false,
        position: "center",
      },
      emphasis: {
        label: {
          show: true,
          fontSize: "18",
          fontWeight: "bold",
          formatter: "{b}\n{c}",
        },
      },
      labelLine: {
        show: false,
      },
      data: chartData,
    },
  ],
};
```

---

## 2. Métricas SQA (Calidad de Software) y Seguridad

### A. Tasa de Éxito de Pruebas (TEP) - Evolución Temporal

```sql
SELECT
  t.fecha as time,
  f.tep as value
FROM metrics.fact_testing f
JOIN metrics.dim_tiempo t ON f.tiempo_id = t.id
ORDER BY t.fecha ASC;
```

- **Panel:** **Business Charts (Apache ECharts)**.
- **JavaScript Code (ECharts Config):**

```javascript
const series = data.series[0];
const times = series.fields
  .find((f) => f.name === "time")
  .values.map((t) => echarts.format.formatTime("yyyy-MM-dd hh:mm", t));
const values = series.fields.find((f) => f.name === "value").values;

return {
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: times,
    axisLabel: { color: "#64748b" },
    axisLine: { lineStyle: { color: "#cbd5e1" } },
  },
  yAxis: {
    type: "value",
    min: 80,
    max: 100,
    axisLabel: { formatter: "{value}%", color: "#64748b" },
    splitLine: { lineStyle: { type: "dashed", color: "#f1f5f9" } },
  },
  tooltip: {
    trigger: "axis",
    formatter: "Fecha: {b0}<br/>Tasa de Éxito: <b>{c0}%</b>",
  },
  series: [
    {
      data: values,
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      lineStyle: {
        width: 3,
        color: "#10b981",
      },
      itemStyle: {
        color: "#10b981",
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(16, 185, 129, 0.3)" },
          { offset: 1, color: "rgba(16, 185, 129, 0)" },
        ]),
      },
    },
  ],
};
```

---

### B. Evolución de Vulnerabilidades por Severidad (Apilado de Áreas)

```sql
SELECT
  t.fecha as time,
  SUM(f.vulnerabilidades_criticas) as "Crítica",
  SUM(f.vulnerabilidades_altas) as "Alta",
  SUM(f.vulnerabilidades_medias) as "Media",
  SUM(f.vulnerabilidades_bajas) as "Baja"
FROM metrics.fact_security f
JOIN metrics.dim_tiempo t ON f.tiempo_id = t.id
GROUP BY t.fecha
ORDER BY t.fecha ASC;
```

- **Panel:** **Business Charts (Apache ECharts)**.
- **JavaScript Code (ECharts Config):**

```javascript
const series = data.series[0];
const times = series.fields
  .find((f) => f.name === "time")
  .values.map((t) => echarts.format.formatTime("yyyy-MM-dd hh:mm", t));
const criticas = series.fields.find((f) => f.name === "Crítica").values;
const altas = series.fields.find((f) => f.name === "Alta").values;
const medias = series.fields.find((f) => f.name === "Media").values;
const bajas = series.fields.find((f) => f.name === "Baja").values;

return {
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "cross", label: { backgroundColor: "#6a7985" } },
  },
  legend: {
    data: ["Crítica", "Alta", "Media", "Baja"],
    textStyle: { color: "#64748b" },
  },
  grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
  xAxis: [
    {
      type: "category",
      boundaryGap: false,
      data: times,
      axisLabel: { color: "#64748b" },
    },
  ],
  yAxis: [{ type: "value", splitLine: { lineStyle: { color: "#f1f5f9" } } }],
  series: [
    {
      name: "Baja",
      type: "line",
      stack: "Total",
      smooth: true,
      areaStyle: {},
      emphasis: { focus: "series" },
      data: bajas,
      color: "#eab308",
    },
    {
      name: "Media",
      type: "line",
      stack: "Total",
      smooth: true,
      areaStyle: {},
      emphasis: { focus: "series" },
      data: medias,
      color: "#f97316",
    },
    {
      name: "Alta",
      type: "line",
      stack: "Total",
      smooth: true,
      areaStyle: {},
      emphasis: { focus: "series" },
      data: altas,
      color: "#ef4444",
    },
    {
      name: "Crítica",
      type: "line",
      stack: "Total",
      smooth: true,
      areaStyle: {},
      emphasis: { focus: "series" },
      data: criticas,
      color: "#7f1d1d",
    },
  ],
};
```

---

## 3. Observabilidad y Rendimiento (Métricas de Servidor)

### A. Top 5 de Endpoints más lentos (ECharts Horizontal Bar)

```sql
SELECT
  CONCAT(e.metodo, ' ', e.path) as metric,
  ROUND(AVG(f.trp)) as value
FROM metrics.fact_performance f
JOIN metrics.dim_endpoint e ON f.endpoint_id = e.id
GROUP BY e.metodo, e.path
ORDER BY value DESC
LIMIT 5;
```

- **Panel:** **Business Charts (Apache ECharts)**.
- **JavaScript Code (ECharts Config):**

```javascript
const series = data.series[0];
const endpoints = series.fields.find((f) => f.name === "metric").values;
const values = series.fields.find((f) => f.name === "value").values;

// Revertir para mostrar de mayor a menor de arriba a abajo en horizontal
const reversedEndpoints = [...endpoints].reverse();
const reversedValues = [...values].reverse();

return {
  grid: { left: "3%", right: "8%", bottom: "3%", containLabel: true },
  xAxis: {
    type: "value",
    name: "ms",
    axisLabel: { color: "#64748b" },
    splitLine: { lineStyle: { type: "dashed", color: "#f1f5f9" } },
  },
  yAxis: {
    type: "category",
    data: reversedEndpoints,
    axisLabel: { color: "#1e293b", fontWeight: "bold" },
  },
  series: [
    {
      type: "bar",
      data: reversedValues,
      showBackground: true,
      backgroundStyle: { color: "rgba(180, 180, 180, 0.1)", borderRadius: 5 },
      itemStyle: {
        borderRadius: 5,
        color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
          { offset: 0, color: "#ef4444" }, // Lento (Rojo)
          { offset: 1, color: "#f97316" }, // Transición (Naranja)
        ]),
      },
      label: {
        show: true,
        position: "right",
        formatter: "{c} ms",
        valueAnimation: true,
      },
    },
  ],
};
```

### B. Tiempo de Respuesta Promedio (TRP) a lo largo del tiempo
Calcula y grafica la latencia promedio del servidor según el rango de tiempo seleccionado en Grafana.

```sql
SELECT
  t.fecha as time,
  ROUND(AVG(f.trp)) AS value
FROM metrics.fact_performance f
JOIN metrics.dim_tiempo t ON f.tiempo_id = t.id
WHERE $__timeFilter(f.logged_at)
GROUP BY t.fecha
ORDER BY t.fecha ASC;
```
* **Panel:** **Business Charts (Apache ECharts)**.
* **JavaScript Code (ECharts Config):**
```javascript
const series = data.series[0];
const times = series.fields.find(f => f.name === 'time').values.map(t => echarts.format.formatTime('yyyy-MM-dd hh:mm', t));
const values = series.fields.find(f => f.name === 'value').values;

return {
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: times,
    axisLabel: { color: '#64748b' }
  },
  yAxis: {
    type: 'value',
    name: 'ms',
    axisLabel: { color: '#64748b' },
    splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
  },
  tooltip: {
    trigger: 'axis',
    formatter: 'Hora: {b0}<br/>TRP Promedio: <b>{c0} ms</b>'
  },
  series: [
    {
      data: values,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 3, color: '#3b82f6' },
      itemStyle: { color: '#3b82f6' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0)' }
        ])
      }
    }
  ]
};
```
