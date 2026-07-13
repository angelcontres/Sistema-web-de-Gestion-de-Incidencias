# Personalización de Diseño en Grafana con Business Text

Para mantener la consistencia visual entre el Sistema Web y los dashboards incrustados de Grafana, utilizaremos el plugin **Business Text (de Volkov Labs)**. Este panel te permite inyectar HTML, CSS y JavaScript personalizados (incluso procesando datos con Handlebars) y te servirá para decorar métricas y crear encabezados idénticos a los del sistema.

## 1. Paleta de Colores del Sistema (`style.css`)

A continuación, las variables de diseño base extraídas de `style.css` para utilizar en Grafana:

- **Fondo de la App / Dashboard:** `#f8fafc` (Slate 50)
- **Fondo de Tarjetas:** `#ffffff`
- **Primario (Royal Purple):** `#7c3aed` (Glow: `rgba(124, 58, 237, 0.15)`)
- **Texto Principal:** `#0f172a` (Slate 900)
- **Texto Muted (Subtítulos):** `#475569` (Slate 600)
- **Éxito:** `#10b981` (Soft: `rgba(16, 185, 129, 0.08)`)
- **Peligro / Crítico:** `#ef4444` (Soft: `rgba(239, 68, 68, 0.08)`)
- **Advertencia:** `#f59e0b` (Soft: `rgba(245, 158, 11, 0.08)`)
- **Bordes:** `rgba(15, 23, 42, 0.06)`

---

## 2. Instrucciones para Configurar el Panel

Para cada tarjeta o título que desees crear en Grafana:

1. Añade un nuevo panel y selecciona la visualización **Business Text**.
2. En las opciones generales del panel (lado derecho), asegúrate de establecer el **fondo transparente** (`Transparent = true`) para evitar el contenedor por defecto de Grafana.
3. En la sección del panel Business Text, verás tres editores: **Content (HTML)**, **CSS**, y **JavaScript**.

---

## 3. Ejemplo Práctico: Tarjeta de Métrica (KPI) Alineada al Sistema

Este ejemplo replica de forma exacta la estructura del archivo `dashboard.component.html`:

- Contenedor con borde redondeado e interactivo: `card border-0 shadow-sm rounded-4 p-4 bg-white`
- Encabezado con ícono de Bootstrap Icons: `bi bi-... text-primary me-2`
- Valor principal con tipografía destacada: `fw-extrabold text-dark`
- Badges estilizados (ej. Live o Estados): `badge bg-danger-soft px-2.5 py-1.5 rounded-pill small fw-bold`

### A. Pestaña CSS

Copia este CSS en el editor de estilos del panel de Grafana para simular el diseño premium del sistema:

> [!WARNING]
> **¡Nunca cargues el CSS de Bootstrap (`bootstrap.min.css`) en Grafana!**
> Si cargas todo el framework Bootstrap con una etiqueta `<link>`, afectará a todo el documento global de Grafana, rompiendo su diseño interno y barra de navegación.
>
> En su lugar, el CSS a continuación incluye **clases de utilidad auto-contenidas y seguras** (como `.text-primary`, `.d-flex`, etc.) prefijadas con `.sys-dashboard-card`. Esto garantiza que los estilos se apliquen únicamente dentro de tu panel y no afecten al resto del dashboard de Grafana.

```css
/* Contenedor Principal Scoped */
.sys-dashboard-card {
  font-family: 'Outfit', sans-serif;
  background-color: #ffffff;
  border: 0;
  border-radius: 16px; /* Equivalente a rounded-4 */
  box-shadow:
    0 10px 25px -5px rgba(15, 23, 42, 0.04),
    0 4px 12px -2px rgba(15, 23, 42, 0.03); /* shadow-sm */
  padding: 1.5rem; /* p-4 */
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.25s ease;
}

.sys-dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px -10px rgba(124, 58, 237, 0.2);
}

.sys-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.sys-card-title {
  font-size: 1rem; /* h5 */
  font-weight: 700; /* fw-bold */
  color: #0f172a; /* text-dark */
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sys-card-value {
  font-size: 2.25rem;
  font-weight: 800; /* fw-extrabold */
  color: #0f172a; /* text-dark */
  margin-top: auto;
  margin-bottom: 0.5rem;
  letter-spacing: -0.04em;
}

.sys-card-subtitle {
  color: #475569; /* text-secondary */
  font-size: 0.875rem;
  margin-bottom: 0;
}

/* Badges y estados del sistema */
.sys-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 50rem; /* rounded-pill */
}

.bg-danger-soft {
  background-color: rgba(239, 68, 68, 0.08);
  color: #ef4444;
}

.bg-success-soft {
  background-color: rgba(16, 185, 129, 0.08);
  color: #10b981;
}

.bg-warning-soft {
  background-color: rgba(245, 158, 11, 0.08);
  color: #f59e0b;
}

/* Clases de Utilidad Scoped (Reemplazan la necesidad de Bootstrap CSS global) */
.sys-dashboard-card .text-primary {
  color: #7c3aed !important;
}

.sys-dashboard-card .text-dark {
  color: #0f172a !important;
}

.sys-dashboard-card .text-secondary {
  color: #475569 !important;
}

.sys-dashboard-card .text-success {
  color: #10b981 !important;
}

.sys-dashboard-card .text-danger {
  color: #ef4444 !important;
}

.sys-dashboard-card .d-flex {
  display: flex !important;
}

.sys-dashboard-card .align-items-center {
  align-items: center !important;
}

.sys-dashboard-card .justify-content-between {
  justify-content: space-between !important;
}

.sys-dashboard-card .gap-2 {
  gap: 0.5rem !important;
}

.sys-dashboard-card .animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.95);
  }
}

.sys-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
}
```

### B. Pestaña Content (HTML)

Copia este HTML y adáptalo a los campos que devuelva tu consulta SQL.

> [!IMPORTANT]
> **Cómo cargar Bootstrap Icons en el HTML:**
> Al no poder usar `@import` en el CSS, tienes dos alternativas para que los iconos de Bootstrap funcionen en tus paneles:
>
> **Método 1: Enlace directo en el HTML (Recomendado y simple):**
> Coloca esta etiqueta stylesheet en la **primera línea** de tu código HTML en la pestaña **Content (HTML)**:
>
> ```html
> <link
>   rel="stylesheet"
>   href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
> />
> ```
>
> _Nota: Esto requiere que tengas configurado `disable_sanitize_html = true` en Grafana (o `GF_PANELS_DISABLE_SANITIZE_HTML=true` en Docker Compose), de lo contrario Grafana eliminará la etiqueta `<link>` por seguridad._
>
> **Método 2: Usar vectores SVG Inline (100% compatible y seguro):**
> Si tu Grafana tiene la sanitización activa y borra la etiqueta `<link>`, debes usar el SVG del icono directamente en lugar de la etiqueta `<i>`. Ejemplo:
>
> ```html
> <svg
>   xmlns="http://www.w3.org/2000/svg"
>   width="16"
>   height="16"
>   fill="currentColor"
>   class="text-primary"
>   viewBox="0 0 16 16"
>   style="margin-right: 8px; vertical-align: middle;"
> >
>   <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
> </svg>
> ```

> [!TIP]
> **¿Te aparece el JSON completo `{ "value": 3 }` en el panel?**
> Eso significa que Grafana no está parseando la propiedad o estás usando el valor por defecto. Asegúrate de referenciar la columna exacta de tu consulta SQL. Si tu query es `SELECT COUNT(*) as value ...`, en el HTML debes usar `{{value}}` (o `{{data.[0].value}}` si es un valor único y no quieres usar un bucle `each`).

#### Opción 1: Consulta SQL de Valor Único (`{ "value": 3 }`)

```html
<div class="sys-dashboard-card">
  <div class="sys-card-header">
    <h5 class="sys-card-title"><i class="bi bi-shield-check text-primary"></i> Casos Activos</h5>
    <span class="sys-badge bg-danger-soft animate-pulse">
      <span class="sys-indicator-dot"></span> Live
    </span>
  </div>
  <h2 class="sys-card-value">{{data.[0].value}}</h2>
  <p class="sys-card-subtitle">Incidencias en proceso o revisión</p>
</div>
```

#### Opción 2: Múltiples registros (Uso de bucle `each`)

```html
<div class="sys-dashboard-card">
  <div class="sys-card-header">
    <h5 class="sys-card-title">
      <i class="bi bi-exclamation-triangle text-primary"></i> Incidencias Críticas
    </h5>
  </div>

  {{#each data}}
  <h2 class="sys-card-value">{{total_incidencias}}</h2>
  <p class="sys-card-subtitle">Último estado: <b>{{estado}}</b></p>
  {{/each}}
</div>
```

---

## 4. Ejemplo Práctico: Títulos y Separadores de Sección

Para agrupar paneles y crear cabeceras temáticas que utilicen exactamente las mismas clases de `dashboard.component.html` (`fw-bold text-dark` e íconos de bootstrap con `text-primary`):

### A. Pestaña CSS

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');

.sys-section-header {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem; /* h5 */
  font-weight: 700; /* fw-bold */
  color: #0f172a; /* text-dark */
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0.5rem;
}

.sys-section-subtitle {
  font-family: 'Outfit', sans-serif;
  color: #64748b; /* text-muted */
  font-size: 0.875rem; /* small */
  margin-bottom: 0;
}
```

### B. Pestaña Content (HTML)

```html
<div>
  <h5 class="sys-section-header">
    <i class="bi bi-shield-lock text-primary"></i> Métricas SQA & Seguridad de Software
  </h5>
  <p class="sys-section-subtitle">
    Monitoreo de vulnerabilidades detectadas y calidad de pruebas del sistema.
  </p>
</div>
```

---

## 5. Recomendaciones Finales para Embebidos Perfectos

Para garantizar que tus paneles Grafana se mezclen transparentemente con el dashboard en el HTML (`dashboard.component.html`), verifica estos parámetros en las URLs (src) de los iframes:

1.  **Forzar el tema claro:** Añade siempre `&theme=light` a la URL del iframe. (O configura el dashboard en Grafana permanentemente en el engranaje de ajustes como "Light Theme").
2.  **Ocultar la interfaz nativa de Grafana:**
    - Si usas paneles individuales, obtén la URL haciendo clic en "Share > Embed", asegurándote de usar `/d-solo/` en la ruta en lugar de `/d/`.
    - Si estás incrustando un dashboard completo, añade el parámetro `&kiosk=tv` (para quitar barras laterales) o `&kiosk=1` (pantalla limpia) al final de tu URL.
3.  **Fondo Transparente:** La propiedad CSS del contenedor de iframes `.bg-white` se encargará del fondo, asegúrate que las gráficas de Grafana (ya sea Apache ECharts nativo o Business Text) tengan sus opciones `Background -> Transparent` activadas.
