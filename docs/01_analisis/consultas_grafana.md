# Consultas y Configuración de Grafana por Rol

Este documento contiene el listado exhaustivo de todos los paneles de Grafana embebidos en el dashboard principal de la aplicación (`dashboard.component.js`), organizados por **Rol de Usuario**.

Para cada panel se detalla el título, la consulta SQL (orientada a nuestro esquema OLAP `metrics`), el tipo de gráfico recomendado y el código _Business Text_ o _Business Charts_ necesario.

> [!NOTE]
> **Nota sobre el CSS de Business Text:**
> Para evitar redundancia, todo panel de tipo **Business Text** asume que has pegado en la pestaña **CSS** el bloque de estilos base del sistema documentado en `frontend/docs/dashboard_grafana.md` (clase `.sys-dashboard-card`, `.sys-card-title`, `.sys-card-value`, etc.). En los ejemplos a continuación solo se detallará el HTML.

---

## Antes de empezar con los graficos: este codigo se me autogeneró cuando seleccioné la opción business charts al tener un grafico de grafana normal. Que diferencia hay con los que tu me has generado?

```javascript
const series = context.panel.data.series.map((s) => {
  const sData =
    s.fields.find((f) => f.type === "number").values.buffer ||
    s.fields.find((f) => f.type === "number").values;
  const sTime =
    s.fields.find((f) => f.type === "time").values.buffer ||
    s.fields.find((f) => f.type === "time").values;

  return {
    name: s.refId,
    type: "line",
    showSymbol: false,
    areaStyle: {
      opacity: 0.1,
    },
    lineStyle: {
      width: 1,
    },
    data: sData.map((d, i) => [sTime[i], d.toFixed(2)]),
  };
});

/**
 * Enable Data Zoom by default
 */
setTimeout(
  () =>
    context.panel.chart.dispatchAction({
      type: "takeGlobalCursor",
      key: "dataZoomSelect",
      dataZoomSelectActive: true,
    }),
  500,
);

/**
 * Update Time Range on Zoom
 */
context.panel.chart.on("datazoom", function (params) {
  const startValue = params.batch[0]?.startValue;
  const endValue = params.batch[0]?.endValue;
  locationService.partial({ from: startValue, to: endValue });
});

return {
  backgroundColor: "transparent",
  tooltip: {
    trigger: "axis",
  },
  legend: {
    left: "0",
    bottom: "0",
    data: context.panel.data.series.map((s) => s.refId),
    textStyle: {
      color: "rgba(128, 128, 128, .9)",
    },
  },
  toolbox: {
    feature: {
      dataZoom: {
        yAxisIndex: "none",
        icon: {
          zoom: "path://",
          back: "path://",
        },
      },
      saveAsImage: {},
    },
  },
  xAxis: {
    type: "time",
  },
  yAxis: {
    type: "value",
    min: "dataMin",
  },
  grid: {
    left: "2%",
    right: "2%",
    top: "2%",
    bottom: 24,
    containLabel: true,
  },
  series,
};
```

## 1. Rol: Admin (Métricas SQA y Rendimiento)

_El administrador requiere visibilidad sobre la calidad del software (SQA), rendimiento de los servidores y métricas de seguridad._

### 1.1 Tiempo de Respuesta Promedio (TRP)

- **Tipo de Gráfico:** Business Charts (Apache ECharts)
- **Consulta SQL:**

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

- **Código JS (ECharts Config):**

```javascript
const series = context.panel.data.series[0];
const times = series.fields
  .find((f) => f.name === "time")
  .values.map((t) => {
    const d = new Date(t);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
const values = series.fields.find((f) => f.name === "value").values;

return {
  grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
  xAxis: { type: "category", data: times, axisLabel: { color: "#64748b" } },
  yAxis: {
    type: "value",
    name: "ms",
    splitLine: { lineStyle: { type: "dashed", color: "#f1f5f9" } },
  },
  tooltip: {
    trigger: "axis",
    formatter: "Hora: {b0}<br/>TRP Promedio: <b>{c0} ms</b>",
  },
  series: [
    {
      data: values,
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      lineStyle: { width: 3, color: "#3b82f6" },
      itemStyle: { color: "#3b82f6" },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(59, 130, 246, 0.3)" },
            { offset: 1, color: "rgba(59, 130, 246, 0)" },
          ],
        },
      },
    },
  ],
};
```

### 1.2 Incidencias Totales

- **Tipo de Gráfico:** Business Text
- **Consulta SQL:**

```sql
SELECT COUNT(id) as value FROM metrics.fact_incidencias;
```

- **Código HTML (Content):**

```html
<div class="sys-dashboard-card">
  <div class="sys-card-header">
    <h5 class="sys-card-title">
      <i class="bi bi-stack text-primary"></i> Incidencias Históricas
    </h5>
  </div>
  <h2 class="sys-card-value">{{data.[0].value}}</h2>
  <p class="sys-card-subtitle">Registros totales en el sistema</p>
</div>
```

### 1.3 Tasa de Éxito de Pruebas (TEP)

- **Tipo de Gráfico:** Business Charts (Apache ECharts)
- **Consulta SQL:**

```sql
SELECT t.fecha as time, f.tep as value
FROM metrics.fact_testing f
JOIN metrics.dim_tiempo t ON f.tiempo_id = t.id
ORDER BY t.fecha ASC;
```

- **Código JS (ECharts Config):**

```javascript
const series = context.panel.data.series[0];
const times = series.fields
  .find((f) => f.name === "time")
  .values.map((t) => {
    const d = new Date(t);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
const values = series.fields.find((f) => f.name === "value").values;

return {
  grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
  xAxis: { type: "category", data: times },
  yAxis: {
    type: "value",
    min: 80,
    max: 100,
    axisLabel: { formatter: "{value}%" },
  },
  tooltip: { trigger: "axis", formatter: "Fecha: {b0}<br/>TEP: <b>{c0}%</b>" },
  series: [
    {
      data: values,
      type: "line",
      smooth: true,
      lineStyle: { width: 3, color: "#10b981" },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(16, 185, 129, 0.3)" },
            { offset: 1, color: "rgba(16, 185, 129, 0)" },
          ],
        },
      },
    },
  ],
};
```

### 1.4 Vulnerabilidades Críticas

- **Tipo de Gráfico:** Business Text
- **Consulta SQL:**

```sql
SELECT COUNT(*) as value
FROM metrics.fact_security f
JOIN metrics.dim_vulnerabilidad v ON f.vulnerabilidad_id = v.id
WHERE v.severidad = 'critical';
```

- **Código HTML (Content):**

```html
<div class="sys-dashboard-card">
  <div class="sys-card-header">
    <h5 class="sys-card-title">
      <i class="bi bi-bug-fill text-danger"></i> Vuln. Críticas
    </h5>
    {{#if (gt data.[0].value 0)}}
    <span class="sys-badge bg-danger-soft animate-pulse"
      ><span class="sys-indicator-dot"></span> Peligro</span
    >
    {{else}}
    <span class="sys-badge bg-success-soft">Seguro</span>
    {{/if}}
  </div>
  <h2 class="sys-card-value text-danger">{{data.[0].value}}</h2>
  <p class="sys-card-subtitle">Fallas críticas de seguridad pendientes</p>
</div>
```

---

## 2. Rol: Supervisor (Gestión Operativa)

_Enfocado en la administración de emergencias, flujos y atención ciudadana._

### 2.1 Incidencias Activas

- **Tipo de Gráfico:** Business Text
- **Consulta SQL:**

```sql
SELECT COUNT(*) as value
FROM metrics.fact_incidencias f
JOIN metrics.dim_estado e ON f.estado_id = e.id
WHERE e.nombre IN ('En Proceso', 'En Revisión');
```

- **Código HTML (Content):**

```html
<div class="sys-dashboard-card">
  <div class="sys-card-header">
    <h5 class="sys-card-title">
      <i class="bi bi-shield-check text-primary"></i> Casos Activos
    </h5>
    <span class="sys-badge bg-warning-soft">En Curso</span>
  </div>
  <h2 class="sys-card-value">{{data.[0].value}}</h2>
  <p class="sys-card-subtitle">Incidencias gestionadas actualmente</p>
</div>
```

### 2.2 Incidencias Sin Asignar

- **Tipo de Gráfico:** Business Text
- **Consulta SQL:**

```sql
SELECT COUNT(*) as value
FROM metrics.fact_incidencias f
JOIN metrics.dim_estado e ON f.estado_id = e.id
WHERE e.nombre = 'Pendiente' AND f.asignado_a IS NULL;
```

- **Código HTML (Content):**

```html
<div class="sys-dashboard-card">
  <div class="sys-card-header">
    <h5 class="sys-card-title">
      <i class="bi bi-person-x text-primary"></i> Sin Asignar
    </h5>
    {{#if (gt data.[0].value 0)}}
    <span class="sys-badge bg-danger-soft animate-pulse"
      ><span class="sys-indicator-dot"></span> Rezagos</span
    >
    {{/if}}
  </div>
  <h2 class="sys-card-value">{{data.[0].value}}</h2>
  <p class="sys-card-subtitle">Casos nuevos en espera de un técnico</p>
</div>
```

### 2.3 Tiempo Promedio de Respuesta

- **Tipo de Gráfico:** Business Text
- **Consulta SQL:**

```sql
SELECT ROUND(AVG(f.tiempo_respuesta_minutos)) as value FROM metrics.fact_incidencias f;
```

- **Código HTML (Content):**

```html
<div class="sys-dashboard-card">
  <div class="sys-card-header">
    <h5 class="sys-card-title">
      <i class="bi bi-stopwatch text-primary"></i> Tiempo de Atención
    </h5>
  </div>
  <h2 class="sys-card-value">
    {{data.[0].value}} <span style="font-size: 1rem; color: #64748b;">min</span>
  </h2>
  <p class="sys-card-subtitle">Promedio de cierre de incidencias</p>
</div>
```

### 2.4 Incidencias por Provincia (Inyectado al final)

- **Tipo de Gráfico:** Business Charts (Apache ECharts - Pie/Donut)
- **Consulta SQL:**

```sql
SELECT t.provincia as metric, SUM(f.cantidad) as value
FROM metrics.fact_incidencias f
JOIN metrics.dim_territorio t ON f.territorio_id = t.id
WHERE t.provincia != 'N/A'
GROUP BY t.provincia;
```

- **Código JS (ECharts Config):**

```javascript
const series = context.panel.data.series[0];
const metrics = series.fields.find((f) => f.name === "metric").values;
const values = series.fields.find((f) => f.name === "value").values;
const chartData = metrics.map((m, idx) => ({ name: m, value: values[idx] }));

return {
  tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
  legend: { orient: "vertical", left: "left", textStyle: { color: "#64748b" } },
  series: [
    {
      name: "Provincia",
      type: "pie",
      radius: ["40%", "70%"],
      itemStyle: { borderRadius: 8, borderColor: "#fff", borderWidth: 2 },
      label: { show: false, position: "center" },
      emphasis: {
        label: {
          show: true,
          fontSize: "18",
          fontWeight: "bold",
          formatter: "{b}\n{c}",
        },
      },
      data: chartData,
    },
  ],
};
```

---

## 3. Rol: Institución (Técnicos / Operarios)

_Visualizan únicamente la carga de trabajo de su departamento (ya sea a nivel general de institución o asignado a ellos personalmente)._

### 3.1 Mis Incidencias Activas

- **Tipo de Gráfico:** Business Text
- **Consulta SQL:**

```sql
SELECT COUNT(*) as value
FROM metrics.fact_incidencias f
JOIN metrics.dim_estado e ON f.estado_id = e.id
WHERE e.nombre IN ('En Proceso', 'En Revisión')
  -- Filtrado por el técnico asignado individualmente:
  AND f.usuario_asignado_id = $usuario_id
  -- (Alternativa si se quiere ver todo el departamento: f.institucion_id = $institucion_id)
```

- **Código HTML (Content):**

```html
<div class="sys-dashboard-card">
  <div class="sys-card-header">
    <h5 class="sys-card-title">
      <i class="bi bi-tools text-primary"></i> Mi Carga Activa
    </h5>
  </div>
  <h2 class="sys-card-value">{{data.[0].value}}</h2>
  <p class="sys-card-subtitle">Casos asignados a mí personalmente</p>
</div>
```

### 3.2 Incidencias Resueltas Hoy

- **Tipo de Gráfico:** Business Text
- **Consulta SQL:**

```sql
SELECT COUNT(*) as value
FROM metrics.fact_incidencias f
JOIN metrics.dim_estado e ON f.estado_id = e.id
JOIN metrics.dim_tiempo t ON f.tiempo_id = t.id
WHERE e.nombre = 'Resuelta' 
  AND t.fecha = CURRENT_DATE
  AND f.usuario_asignado_id = $usuario_id;
```

- **Código HTML (Content):**

```html
<div class="sys-dashboard-card">
  <div class="sys-card-header">
    <h5 class="sys-card-title">
      <i class="bi bi-check-circle-fill text-success"></i> Resueltas Hoy
    </h5>
  </div>
  <h2 class="sys-card-value text-success">{{data.[0].value}}</h2>
  <p class="sys-card-subtitle">Buen trabajo, tus incidentes solucionados hoy</p>
</div>
```

---

## 4. Rol: Ciudadano

_Métricas personales de un ciudadano sobre los reportes que ha subido a la plataforma._

### 4.1 Mis Reportes Realizados

- **Tipo de Gráfico:** Business Text
- **Consulta SQL:**

```sql
SELECT COUNT(*) as value
FROM metrics.fact_incidencias f
-- WHERE f.ciudadano_id = ${usuario_id}
```

- **Código HTML (Content):**

```html
<div class="sys-dashboard-card">
  <div class="sys-card-header">
    <h5 class="sys-card-title">
      <i class="bi bi-file-earmark-text text-primary"></i> Mis Reportes
    </h5>
  </div>
  <h2 class="sys-card-value">{{data.[0].value}}</h2>
  <p class="sys-card-subtitle">Historial de alertas emitidas</p>
</div>
```

### 4.2 Mis Reportes Resueltos

- **Tipo de Gráfico:** Business Text
- **Consulta SQL:**

```sql
SELECT COUNT(*) as value
FROM metrics.fact_incidencias f
JOIN metrics.dim_estado e ON f.estado_id = e.id
WHERE e.nombre = 'Resuelta'
-- AND f.ciudadano_id = ${usuario_id}
```

- **Código HTML (Content):**

```html
<div class="sys-dashboard-card">
  <div class="sys-card-header">
    <h5 class="sys-card-title">
      <i class="bi bi-award-fill text-primary"></i> Solucionados
    </h5>
  </div>
  <h2 class="sys-card-value">{{data.[0].value}}</h2>
  <p class="sys-card-subtitle">Problemas reportados que ya fueron reparados</p>
</div>
```

---

## 5. Default (Público General)

_Si un usuario no tiene permisos asignados, visualiza métricas genéricas._

### 5.1 Incidencias Activas

- **Tipo de Gráfico:** Business Text
- **Consulta SQL:**

```sql
SELECT COUNT(*) as value
FROM metrics.fact_incidencias f
JOIN metrics.dim_estado e ON f.estado_id = e.id
WHERE e.nombre IN ('En Proceso', 'En Revisión');
```

- **Código HTML (Content):**

```html
<div class="sys-dashboard-card">
  <div class="sys-card-header">
    <h5 class="sys-card-title">
      <i class="bi bi-activity text-primary"></i> Afectaciones Actuales
    </h5>
    <span class="sys-badge bg-danger-soft animate-pulse"
      ><span class="sys-indicator-dot"></span> Live</span
    >
  </div>
  <h2 class="sys-card-value">{{data.[0].value}}</h2>
  <p class="sys-card-subtitle">Incidentes públicos en reparación</p>
</div>
```

### 5.2 Resueltas Hoy

- **Tipo de Gráfico:** Business Text
- **Consulta SQL:**

```sql
SELECT COUNT(*) as value
FROM metrics.fact_incidencias f
JOIN metrics.dim_estado e ON f.estado_id = e.id
JOIN metrics.dim_tiempo t ON f.tiempo_id = t.id
WHERE e.nombre = 'Resuelta' AND t.fecha = CURRENT_DATE;
```

- **Código HTML (Content):**

```html
<div class="sys-dashboard-card">
  <div class="sys-card-header">
    <h5 class="sys-card-title">
      <i class="bi bi-heart-fill text-primary"></i> Resueltas Hoy
    </h5>
  </div>
  <h2 class="sys-card-value">{{data.[0].value}}</h2>
  <p class="sys-card-subtitle">
    Trabajo completado exitosamente a nivel cantonal
  </p>
</div>
```
