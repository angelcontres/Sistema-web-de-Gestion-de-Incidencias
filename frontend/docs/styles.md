````markdown
# 🎨 Gentelella v4 — Sistema de Estilos CSS/SCSS

## Documento de Referencia de Diseño

> **Versión:** Gentelella v4 (2026)  
> **Autor:** Colorlib  
> **Licencia:** MIT  
> **Stack:** Vanilla JS + SCSS + Vite 8 (Sin Bootstrap, sin jQuery)

---

## 📁 Índice de Archivos SCSS

| Archivo            | Descripción                                       |
| ------------------ | ------------------------------------------------- |
| `main.scss`        | Agregador principal (`@use`)                      |
| `_tokens.scss`     | Tokens de diseño (colores, tipografía, espaciado) |
| `_layout.scss`     | Sidebar, topbar, grid, footer, responsive         |
| `_components.scss` | Botones, cards, tablas, badges, toggles, progress |
| `_forms.scss`      | Inputs, selects, validación, input groups         |
| `_widgets.scss`    | Stat cards, actividad, donuts, sparklines, todos  |
| `_pages.scss`      | Paginación, alerts, calendario, inbox, invoice    |
| `_datatable.scss`  | Overrides de DataTables UI                        |
| `_auth.scss`       | Layouts de login y errores                        |
| `_apps.scss`       | Chat, kanban, file manager, settings              |

---

## 1. TOKENS DE DISEÑO (`_tokens.scss`)

### 1.1 Colores Principales

```css
:root {
  /* Sidebar */
  --sidebar-bg: #1a2332;
  --sidebar-hover: rgba(255, 255, 255, 0.04);
  --sidebar-active: rgba(26, 187, 156, 0.08);
  --sidebar-text: #7b8fa3;
  --sidebar-text-hover: #c5d0dc;
  --sidebar-text-active: #ffffff;
  --sidebar-border: rgba(255, 255, 255, 0.06);
  --sidebar-w: 252px;

  /* Brand / Primary */
  --primary: #1abb9c;
  --primary-lt: rgba(26, 187, 156, 0.06);
  --primary-dk: #169f85;

  /* Superficies */
  --body-bg: #f5f7fb;
  --bg-surface: #ffffff;
  --bg-surface-secondary: #f9fafb;

  /* Bordes */
  --border-color: #e6e7eb;
  --border-color-light: #eff0f3;
  --border-translucent: rgba(4, 32, 69, 0.08);

  /* Texto */
  --text: #1e2633;
  --text-secondary: #626d7d;
  --text-muted: #7e8896;
  --text-disabled: #c0c7cf;
}
```
````

### 1.2 Paleta Semántica de Estado

```css
:root {
  --blue: #066fd1;
  --azure: #4299e1;
  --green: #2fb344;
  --lime: #74b816;
  --yellow: #f59f00;
  --orange: #f76707;
  --red: #d63939;
  --pink: #d6336c;
  --purple: #ae3ec9;
  --indigo: #4263eb;
  --cyan: #17a2b8;

  /* Variantes light para fondos */
  --green-lt: rgba(47, 179, 68, 0.06);
  --red-lt: rgba(214, 57, 57, 0.06);
  --yellow-lt: rgba(245, 159, 0, 0.06);
  --blue-lt: rgba(6, 111, 209, 0.06);
  --azure-lt: rgba(66, 153, 225, 0.06);
  --purple-lt: rgba(174, 62, 201, 0.06);
  --cyan-lt: rgba(23, 162, 184, 0.06);
}
```

### 1.3 Tipografía

```css
:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-base: 14px;
  --line-height-base: 1.4286;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### 1.4 Radios y Sombras

```css
:root {
  --radius: 6px;
  --radius-sm: 4px;
  --radius-lg: 8px;

  --shadow: rgba(30, 38, 51, 0.04) 0 2px 4px 0;
  --shadow-card: 0 0 0 1px var(--border-translucent), rgba(30, 38, 51, 0.04) 0 2px 8px 0;
  --shadow-dropdown: 0 4px 12px rgba(30, 38, 51, 0.08);
  --shadow-modal: 0 16px 48px rgba(30, 38, 51, 0.12);
}
```

### 1.5 Escala de Espaciado (4px base)

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
}
```

---

## 2. LAYOUT (`_layout.scss`)

### 2.1 Estructura Base

```css
html {
  font-size: var(--font-size-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-family);
  line-height: var(--line-height-base);
  color: var(--text);
  background-color: var(--body-bg);
  margin: 0;
  min-height: 100vh;
}

/* Skip link para accesibilidad */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--primary);
  color: #fff;
  padding: 8px 16px;
  z-index: 10000;
  transition: top 0.2s;
}
.skip-link:focus {
  top: 0;
}
```

### 2.2 Sidebar

```css
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-w);
  height: 100vh;
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: width 0.3s ease;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--sidebar-border);
  color: #fff;
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
}

.sidebar__brand-icon {
  width: 32px;
  height: 32px;
  margin-right: var(--space-3);
  background: var(--primary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar__menu {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3) 0;
}

/* Scrollbar personalizada */
.sidebar__menu::-webkit-scrollbar {
  width: 4px;
}
.sidebar__menu::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar__menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

/* Items del menú */
.nav-item {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-5);
  color: var(--sidebar-text);
  text-decoration: none;
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  transition: all 0.15s ease;
  cursor: pointer;
  border-radius: 0;
}

.nav-item:hover {
  background: var(--sidebar-hover);
  color: var(--sidebar-text-hover);
}

.nav-item.active {
  background: var(--sidebar-active);
  color: var(--sidebar-text-active);
  border-left: 3px solid var(--primary);
}

.nav-item__icon {
  width: 20px;
  height: 20px;
  margin-right: var(--space-3);
  opacity: 0.7;
  transition: opacity 0.15s;
}

.nav-item:hover .nav-item__icon,
.nav-item.active .nav-item__icon {
  opacity: 1;
}

/* Submenú */
.nav-submenu {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  background: rgba(0, 0, 0, 0.15);
}

.nav-item.expanded + .nav-submenu,
.nav-submenu.open {
  max-height: 500px;
}

.nav-submenu .nav-item {
  padding-left: calc(var(--space-5) + 28px);
  font-size: 12px;
}

/* Sección del menú */
.menu-section {
  padding: var(--space-2) var(--space-5);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sidebar-text);
  opacity: 0.5;
  margin-top: var(--space-3);
}

/* Sidebar Rail Mode (colapsado) */
.sidebar--rail {
  width: 64px;
}

.sidebar--rail .nav-item {
  justify-content: center;
  padding: var(--space-3);
}

.sidebar--rail .nav-item__icon {
  margin-right: 0;
}

.sidebar--rail .nav-item__text,
.sidebar--rail .menu-section,
.sidebar--rail .sidebar__brand-text {
  display: none;
}

.sidebar--rail .nav-item:hover .nav-item__tooltip {
  display: block;
}

.nav-item__tooltip {
  display: none;
  position: absolute;
  left: 72px;
  background: var(--text);
  color: #fff;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: 12px;
  white-space: nowrap;
  z-index: 1001;
}
```

### 2.3 Topbar

```css
.topbar {
  position: fixed;
  top: 0;
  left: var(--sidebar-w);
  right: 0;
  height: 56px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-5);
  z-index: 999;
  transition: left 0.3s ease;
}

.topbar__left,
.topbar__right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* Toggle del sidebar */
.sidebar-toggle {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.sidebar-toggle:hover {
  background: var(--bg-surface-secondary);
  color: var(--text);
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 13px;
  color: var(--text-muted);
}

.breadcrumb__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.breadcrumb__item:not(:last-child)::after {
  content: '/';
  color: var(--border-color);
}

.breadcrumb__item a {
  color: var(--text-secondary);
  text-decoration: none;
}

.breadcrumb__item a:hover {
  color: var(--primary);
}

.breadcrumb__item--current {
  color: var(--text);
  font-weight: var(--font-weight-medium);
}

/* Notificaciones y perfil */
.topbar__icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.15s;
}

.topbar__icon-btn:hover {
  background: var(--bg-surface-secondary);
  color: var(--text);
}

.topbar__badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--red);
  color: #fff;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.topbar__profile {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.15s;
}

.topbar__profile:hover {
  background: var(--bg-surface-secondary);
}

.topbar__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.topbar__profile-name {
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  color: var(--text);
}

.topbar__profile-role {
  font-size: 11px;
  color: var(--text-muted);
}
```

### 2.4 Área de Contenido Principal

```css
.content {
  margin-left: var(--sidebar-w);
  margin-top: 56px;
  padding: var(--space-5);
  min-height: calc(100vh - 56px);
  transition: margin-left 0.3s ease;
}

.content__header {
  margin-bottom: var(--space-5);
}

.content__title {
  font-size: 24px;
  font-weight: var(--font-weight-bold);
  color: var(--text);
  margin: 0 0 var(--space-2) 0;
}

.content__subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* Grid del dashboard */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-5);
}

.dashboard-grid__col-3 {
  grid-column: span 3;
}
.dashboard-grid__col-4 {
  grid-column: span 4;
}
.dashboard-grid__col-6 {
  grid-column: span 6;
}
.dashboard-grid__col-8 {
  grid-column: span 8;
}
.dashboard-grid__col-9 {
  grid-column: span 9;
}
.dashboard-grid__col-12 {
  grid-column: span 12;
}

@media (max-width: 1200px) {
  .dashboard-grid__col-3,
  .dashboard-grid__col-4 {
    grid-column: span 6;
  }
}

@media (max-width: 768px) {
  .dashboard-grid__col-3,
  .dashboard-grid__col-4,
  .dashboard-grid__col-6,
  .dashboard-grid__col-8,
  .dashboard-grid__col-9 {
    grid-column: span 12;
  }
}
```

### 2.5 Footer

```css
.footer {
  margin-left: var(--sidebar-w);
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border-color);
  background: var(--bg-surface);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-muted);
}

.footer a {
  color: var(--text-secondary);
  text-decoration: none;
}

.footer a:hover {
  color: var(--primary);
}
```

### 2.6 Responsive

```css
@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .topbar,
  .content,
  .footer {
    left: 0;
    margin-left: 0;
  }

  .sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .sidebar--open + .sidebar-overlay {
    display: block;
  }
}

@media (max-width: 768px) {
  .content {
    padding: var(--space-4);
  }

  .topbar {
    padding: 0 var(--space-4);
  }

  .breadcrumb {
    display: none;
  }
}
```

---

## 3. COMPONENTES (`_components.scss`)

### 3.1 Botones

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  border: 1px solid transparent;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
}

.btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Variantes */
.btn--primary {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.btn--primary:hover {
  background: var(--primary-dk);
  border-color: var(--primary-dk);
}

.btn--secondary {
  background: var(--bg-surface-secondary);
  color: var(--text);
  border-color: var(--border-color);
}

.btn--secondary:hover {
  background: var(--border-color-light);
}

.btn--ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.btn--ghost:hover {
  background: var(--bg-surface-secondary);
  color: var(--text);
}

.btn--danger {
  background: var(--red);
  color: #fff;
  border-color: var(--red);
}

.btn--danger:hover {
  background: #b52b2b;
  border-color: #b52b2b;
}

/* Tamaños */
.btn--sm {
  padding: var(--space-1) var(--space-3);
  font-size: 12px;
  border-radius: var(--radius-sm);
}

.btn--lg {
  padding: var(--space-3) var(--space-5);
  font-size: 14px;
}

/* Estado */
.btn:disabled,
.btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Icono */
.btn__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.btn--icon-only {
  padding: var(--space-2);
  width: 36px;
  height: 36px;
}
```

### 3.2 Cards

```css
.card {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  border: none;
  overflow: hidden;
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-color-light);
}

.card__title {
  font-size: 15px;
  font-weight: var(--font-weight-semibold);
  color: var(--text);
  margin: 0;
}

.card__subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: var(--space-1);
}

.card__actions {
  display: flex;
  gap: var(--space-2);
}

.card__body {
  padding: var(--space-5);
}

.card__footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border-color-light);
  background: var(--bg-surface-secondary);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

/* Card sin padding en body (para tablas/charts) */
.card--flush .card__body {
  padding: 0;
}

/* Card con borde de color */
.card--border-primary {
  border-top: 3px solid var(--primary);
}
.card--border-blue {
  border-top: 3px solid var(--blue);
}
.card--border-green {
  border-top: 3px solid var(--green);
}
.card--border-red {
  border-top: 3px solid var(--red);
}
.card--border-yellow {
  border-top: 3px solid var(--yellow);
}
```

### 3.3 Badges y Etiquetas de Estado

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px 8px;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  border-radius: 100px;
  line-height: 1.5;
  white-space: nowrap;
}

.badge--primary {
  background: var(--primary-lt);
  color: var(--primary-dk);
}
.badge--blue {
  background: var(--blue-lt);
  color: var(--blue);
}
.badge--green {
  background: var(--green-lt);
  color: var(--green);
}
.badge--red {
  background: var(--red-lt);
  color: var(--red);
}
.badge--yellow {
  background: var(--yellow-lt);
  color: var(--yellow);
}
.badge--purple {
  background: var(--purple-lt);
  color: var(--purple);
}
.badge--cyan {
  background: var(--cyan-lt);
  color: var(--cyan);
}

.badge--outline {
  background: transparent;
  border: 1px solid currentColor;
}

/* Dot indicator */
.badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
```

### 3.4 Tablas

```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table th,
.table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-color-light);
}

.table th {
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--bg-surface-secondary);
  white-space: nowrap;
}

.table tbody tr {
  transition: background 0.1s;
}

.table tbody tr:hover {
  background: var(--bg-surface-secondary);
}

.table--striped tbody tr:nth-child(even) {
  background: var(--bg-surface-secondary);
}

/* Tabla compacta */
.table--sm th,
.table--sm td {
  padding: var(--space-2) var(--space-3);
}

/* Tabla con selección */
.table tbody tr.selected {
  background: var(--primary-lt);
}

/* Celda de acciones */
.table__actions {
  display: flex;
  gap: var(--space-2);
  opacity: 0;
  transition: opacity 0.15s;
}

.table tbody tr:hover .table__actions {
  opacity: 1;
}

.table__action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.table__action-btn:hover {
  background: var(--border-color-light);
  color: var(--text);
}
```

### 3.5 Alerts

```css
.alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius);
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid transparent;
}

.alert__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}

.alert__content {
  flex: 1;
}
.alert__title {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-1);
}

.alert__close {
  background: none;
  border: none;
  color: inherit;
  opacity: 0.5;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert__close:hover {
  opacity: 1;
}

.alert--info {
  background: var(--blue-lt);
  color: var(--blue);
  border-color: rgba(6, 111, 209, 0.15);
}

.alert--success {
  background: var(--green-lt);
  color: var(--green);
  border-color: rgba(47, 179, 68, 0.15);
}

.alert--warning {
  background: var(--yellow-lt);
  color: var(--yellow);
  border-color: rgba(245, 159, 0, 0.15);
}

.alert--danger {
  background: var(--red-lt);
  color: var(--red);
  border-color: rgba(214, 57, 57, 0.15);
}
```

### 3.6 Progress Bars

```css
.progress {
  height: 6px;
  background: var(--border-color-light);
  border-radius: 100px;
  overflow: hidden;
}

.progress__bar {
  height: 100%;
  background: var(--primary);
  border-radius: 100px;
  transition: width 0.3s ease;
}

.progress--sm {
  height: 4px;
}
.progress--lg {
  height: 10px;
}

.progress__bar--blue {
  background: var(--blue);
}
.progress__bar--green {
  background: var(--green);
}
.progress__bar--red {
  background: var(--red);
}
.progress__bar--yellow {
  background: var(--yellow);
}

/* Progress con label */
.progress-labeled {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.progress-labeled .progress {
  flex: 1;
}
.progress-labeled__value {
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  min-width: 36px;
  text-align: right;
}
```

### 3.7 Toggles / Switches

```css
.toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  user-select: none;
}

.toggle__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle__switch {
  position: relative;
  width: 40px;
  height: 22px;
  background: var(--border-color);
  border-radius: 11px;
  transition: background 0.2s;
}

.toggle__switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.toggle__input:checked + .toggle__switch {
  background: var(--primary);
}

.toggle__input:checked + .toggle__switch::after {
  transform: translateX(18px);
}

.toggle__label {
  font-size: 13px;
  color: var(--text);
}
```

### 3.8 Tooltips y Popovers

```css
.tooltip {
  position: relative;
}

.tooltip__content {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-2) var(--space-3);
  background: var(--text);
  color: #fff;
  font-size: 12px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.15s;
  z-index: 10000;
}

.tooltip__content::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--text);
}

.tooltip:hover .tooltip__content {
  opacity: 1;
  visibility: visible;
}

/* Popover */
.popover {
  position: absolute;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-dropdown);
  border: 1px solid var(--border-color);
  padding: var(--space-3);
  z-index: 10000;
  min-width: 200px;
}
```

---

## 4. FORMULARIOS (`_forms.scss`)

### 4.1 Inputs Base

```css
.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  color: var(--text);
  margin-bottom: var(--space-2);
}

.form-label--required::after {
  content: '*';
  color: var(--red);
  margin-left: 2px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: 13px;
  font-family: inherit;
  color: var(--text);
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  transition: all 0.15s;
  outline: none;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--text-disabled);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-lt);
}

.form-input:disabled,
.form-select:disabled,
.form-textarea:disabled {
  background: var(--bg-surface-secondary);
  color: var(--text-disabled);
  cursor: not-allowed;
}

/* Tamaños */
.form-input--sm,
.form-select--sm {
  padding: var(--space-1) var(--space-2);
  font-size: 12px;
}

.form-input--lg,
.form-select--lg {
  padding: var(--space-3) var(--space-4);
  font-size: 14px;
}

/* Estados de validación */
.form-group--error .form-input,
.form-group--error .form-select,
.form-group--error .form-textarea {
  border-color: var(--red);
}

.form-group--error .form-input:focus,
.form-group--error .form-select:focus,
.form-group--error .form-textarea:focus {
  box-shadow: 0 0 0 3px var(--red-lt);
}

.form-error {
  font-size: 12px;
  color: var(--red);
  margin-top: var(--space-1);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.form-group--success .form-input {
  border-color: var(--green);
}

.form-group--success .form-input:focus {
  box-shadow: 0 0 0 3px var(--green-lt);
}
```

### 4.2 Input Groups

```css
.input-group {
  display: flex;
  align-items: stretch;
}

.input-group .form-input {
  flex: 1;
  border-radius: 0;
}

.input-group__prepend,
.input-group__append {
  display: flex;
  align-items: center;
  padding: 0 var(--space-3);
  background: var(--bg-surface-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: 13px;
  white-space: nowrap;
}

.input-group__prepend {
  border-right: none;
  border-radius: var(--radius) 0 0 var(--radius);
}

.input-group__append {
  border-left: none;
  border-radius: 0 var(--radius) var(--radius) 0;
}

.input-group .form-input:first-child {
  border-radius: var(--radius) 0 0 var(--radius);
}

.input-group .form-input:last-child {
  border-radius: 0 var(--radius) var(--radius) 0;
}

/* Input group con botón */
.input-group__btn {
  padding: 0 var(--space-4);
  background: var(--primary);
  color: #fff;
  border: 1px solid var(--primary);
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.15s;
}

.input-group__btn:hover {
  background: var(--primary-dk);
}

.input-group__btn--append {
  border-radius: 0 var(--radius) var(--radius) 0;
}
```

### 4.3 Checkbox y Radio

```css
.form-check {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  color: var(--text);
}

.form-check__input {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  appearance: none;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
  flex-shrink: 0;
}

.form-check__input:checked {
  background: var(--primary);
  border-color: var(--primary);
}

.form-check__input:checked::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 5px;
  width: 4px;
  height: 8px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.form-check__input[type='radio'] {
  border-radius: 50%;
}

.form-check__input[type='radio']:checked::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 8px;
  height: 8px;
  background: #fff;
  border-radius: 50%;
  border: none;
  transform: none;
}

.form-check__input:focus {
  box-shadow: 0 0 0 3px var(--primary-lt);
}
```

### 4.4 Select Custom

```css
.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23626d7d' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.form-select[multiple] {
  background-image: none;
  padding-right: var(--space-3);
  min-height: 100px;
}
```

---

## 5. WIDGETS (`_widgets.scss`)

### 5.1 Stat Cards (KPIs)

```css
.stat-card {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: var(--space-5);
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

.stat-card__icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card__icon--primary {
  background: var(--primary-lt);
  color: var(--primary);
}
.stat-card__icon--blue {
  background: var(--blue-lt);
  color: var(--blue);
}
.stat-card__icon--green {
  background: var(--green-lt);
  color: var(--green);
}
.stat-card__icon--red {
  background: var(--red-lt);
  color: var(--red);
}
.stat-card__icon--yellow {
  background: var(--yellow-lt);
  color: var(--yellow);
}

.stat-card__content {
  flex: 1;
}

.stat-card__value {
  font-size: 28px;
  font-weight: var(--font-weight-bold);
  color: var(--text);
  line-height: 1.2;
  margin: 0;
}

.stat-card__label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.stat-card__change {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  margin-top: var(--space-2);
  padding: 2px 8px;
  border-radius: 100px;
}

.stat-card__change--up {
  color: var(--green);
  background: var(--green-lt);
}

.stat-card__change--down {
  color: var(--red);
  background: var(--red-lt);
}
```

### 5.2 Activity Feed

```css
.activity-feed {
  list-style: none;
  margin: 0;
  padding: 0;
}

.activity-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  position: relative;
}

.activity-item:not(:last-child) {
  border-bottom: 1px solid var(--border-color-light);
}

.activity-item__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.activity-item__content {
  flex: 1;
  min-width: 0;
}

.activity-item__text {
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
  margin: 0;
}

.activity-item__text strong {
  font-weight: var(--font-weight-semibold);
  color: var(--text);
}

.activity-item__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
  font-size: 12px;
  color: var(--text-muted);
}

.activity-item__time::before {
  content: '•';
  margin-right: var(--space-2);
  color: var(--border-color);
}
```

### 5.3 Donut Charts (Mini)

```css
.donut-widget {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
}

.donut-widget__chart {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  position: relative;
}

.donut-widget__chart svg {
  transform: rotate(-90deg);
}

.donut-widget__info {
  flex: 1;
}

.donut-widget__value {
  font-size: 24px;
  font-weight: var(--font-weight-bold);
  color: var(--text);
}

.donut-widget__label {
  font-size: 12px;
  color: var(--text-muted);
}

.donut-widget__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.donut-widget__legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 12px;
  color: var(--text-secondary);
}

.donut-widget__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
```

### 5.4 Todo List

```css
.todo-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-color-light);
  transition: background 0.1s;
}

.todo-item:hover {
  background: var(--bg-surface-secondary);
}

.todo-item--completed .todo-item__text {
  text-decoration: line-through;
  color: var(--text-disabled);
}

.todo-item__drag {
  color: var(--border-color);
  cursor: grab;
}

.todo-item__text {
  flex: 1;
  font-size: 13px;
  color: var(--text);
}

.todo-item__actions {
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity 0.15s;
}

.todo-item:hover .todo-item__actions {
  opacity: 1;
}
```

---

## 6. PÁGINAS ESPECÍFICAS (`_pages.scss`)

### 6.1 Paginación

```css
.pagination {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  list-style: none;
  margin: 0;
  padding: 0;
}

.pagination__item {
}

.pagination__link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 var(--space-2);
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: all 0.15s;
}

.pagination__link:hover {
  background: var(--bg-surface-secondary);
  color: var(--text);
}

.pagination__item--active .pagination__link {
  background: var(--primary);
  color: #fff;
}

.pagination__item--disabled .pagination__link {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
```

### 6.2 Calendario

```css
.calendar {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.calendar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-color-light);
}

.calendar__title {
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
}

.calendar__nav {
  display: flex;
  gap: var(--space-2);
}

.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar__day-header {
  padding: var(--space-3);
  text-align: center;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
}

.calendar__day {
  aspect-ratio: 1;
  padding: var(--space-2);
  border: 1px solid var(--border-color-light);
  border-width: 1px 1px 0 0;
  cursor: pointer;
  transition: background 0.1s;
  position: relative;
}

.calendar__day:hover {
  background: var(--bg-surface-secondary);
}

.calendar__day--today {
  background: var(--primary-lt);
}

.calendar__day--today .calendar__day-number {
  color: var(--primary);
  font-weight: var(--font-weight-bold);
}

.calendar__day--other-month {
  color: var(--text-disabled);
  background: var(--bg-surface-secondary);
}

.calendar__day-number {
  font-size: 13px;
  color: var(--text);
}

.calendar__event {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar__event--primary {
  background: var(--primary-lt);
  color: var(--primary-dk);
}
.calendar__event--blue {
  background: var(--blue-lt);
  color: var(--blue);
}
.calendar__event--red {
  background: var(--red-lt);
  color: var(--red);
}
```

### 6.3 Invoice

```css
.invoice {
  max-width: 800px;
  margin: 0 auto;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: var(--space-7);
}

.invoice__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-7);
}

.invoice__brand {
  font-size: 24px;
  font-weight: var(--font-weight-bold);
  color: var(--text);
}

.invoice__meta {
  text-align: right;
  font-size: 13px;
  color: var(--text-secondary);
}

.invoice__meta-row {
  margin-bottom: var(--space-1);
}

.invoice__section {
  margin-bottom: var(--space-6);
}

.invoice__section-title {
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-3);
}

.invoice__table {
  width: 100%;
  border-collapse: collapse;
}

.invoice__table th,
.invoice__table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-color-light);
}

.invoice__table th {
  background: var(--bg-surface-secondary);
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.invoice__table td {
  font-size: 13px;
}

.invoice__total {
  margin-top: var(--space-5);
  border-top: 2px solid var(--border-color);
  padding-top: var(--space-4);
}

.invoice__total-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  font-size: 13px;
}

.invoice__total-row--grand {
  font-size: 18px;
  font-weight: var(--font-weight-bold);
  color: var(--text);
  border-top: 1px solid var(--border-color);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
}
```

---

## 7. DATATABLES (`_datatable.scss`)

```css
/* Overrides de DataTables para que coincidan con el sistema de diseño */
.dataTables_wrapper {
  font-size: 13px;
}

.dataTables_length,
.dataTables_filter {
  margin-bottom: var(--space-4);
}

.dataTables_length select,
.dataTables_filter input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  font-size: 13px;
  outline: none;
}

.dataTables_filter input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-lt);
}

.dataTables_paginate {
  margin-top: var(--space-4);
  display: flex;
  gap: var(--space-1);
}

.paginate_button {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.15s;
}

.paginate_button:hover {
  background: var(--bg-surface-secondary);
  color: var(--text);
}

.paginate_button.current {
  background: var(--primary);
  color: #fff;
}

.paginate_button.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Sorting icons */
table.dataTable thead .sorting,
table.dataTable thead .sorting_asc,
table.dataTable thead .sorting_desc {
  background-image: none !important;
  position: relative;
}

table.dataTable thead .sorting::after,
table.dataTable thead .sorting_asc::after,
table.dataTable thead .sorting_desc::after {
  content: '';
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
}

table.dataTable thead .sorting::after {
  border-top: 4px solid var(--border-color);
  border-bottom: 4px solid var(--border-color);
}

table.dataTable thead .sorting_asc::after {
  border-bottom: 4px solid var(--primary);
}

table.dataTable thead .sorting_desc::after {
  border-top: 4px solid var(--primary);
}
```

---

## 8. AUTENTICACIÓN (`_auth.scss`)

```css
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--sidebar-bg) 0%, #0f1720 100%);
  padding: var(--space-5);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-modal);
  padding: var(--space-7);
}

.auth-card__header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.auth-card__logo {
  width: 56px;
  height: 56px;
  background: var(--primary);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-4);
}

.auth-card__title {
  font-size: 22px;
  font-weight: var(--font-weight-bold);
  color: var(--text);
  margin: 0 0 var(--space-2);
}

.auth-card__subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.auth-card__divider {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-5) 0;
  color: var(--text-muted);
  font-size: 12px;
}

.auth-card__divider::before,
.auth-card__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.auth-social {
  display: flex;
  gap: var(--space-3);
}

.auth-social__btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-surface);
  color: var(--text);
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.15s;
}

.auth-social__btn:hover {
  background: var(--bg-surface-secondary);
  border-color: var(--border-color-light);
}

/* Error pages (403, 404, 500) */
.error-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-5);
}

.error-page__code {
  font-size: 120px;
  font-weight: var(--font-weight-bold);
  color: var(--primary);
  line-height: 1;
  margin-bottom: var(--space-4);
}

.error-page__title {
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--text);
  margin-bottom: var(--space-3);
}

.error-page__desc {
  font-size: 15px;
  color: var(--text-secondary);
  max-width: 400px;
  margin-bottom: var(--space-6);
}
```

---

## 9. APLICACIONES (`_apps.scss`)

### 9.1 Kanban

```css
.kanban {
  display: flex;
  gap: var(--space-4);
  overflow-x: auto;
  padding-bottom: var(--space-3);
}

.kanban__column {
  min-width: 300px;
  max-width: 300px;
  background: var(--bg-surface-secondary);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px);
}

.kanban__column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-color-light);
}

.kanban__column-title {
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  color: var(--text);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.kanban__count {
  background: var(--border-color);
  color: var(--text-secondary);
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 100px;
}

.kanban__column-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.kanban__card {
  background: var(--bg-surface);
  border-radius: var(--radius);
  padding: var(--space-4);
  box-shadow: var(--shadow);
  cursor: grab;
  transition:
    box-shadow 0.15s,
    transform 0.15s;
  border: 1px solid transparent;
}

.kanban__card:hover {
  box-shadow: var(--shadow-card);
  border-color: var(--border-color);
}

.kanban__card--dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}

.kanban__card-title {
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  color: var(--text);
  margin: 0 0 var(--space-2);
}

.kanban__card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-3);
}

.kanban__card-tags {
  display: flex;
  gap: var(--space-1);
}

.kanban__card-tag {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.kanban__card-assignees {
  display: flex;
  margin-left: auto;
}

.kanban__card-assignees img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--bg-surface);
  margin-left: -6px;
}

.kanban__card-assignees img:first-child {
  margin-left: 0;
}
```

### 9.2 File Manager

```css
.file-manager {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: var(--space-5);
  height: calc(100vh - 180px);
}

.file-manager__sidebar {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  overflow-y: auto;
}

.file-manager__tree {
  list-style: none;
  margin: 0;
  padding: 0;
}

.file-manager__tree-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.1s;
}

.file-manager__tree-item:hover {
  background: var(--bg-surface-secondary);
  color: var(--text);
}

.file-manager__tree-item--active {
  background: var(--primary-lt);
  color: var(--primary-dk);
  font-weight: var(--font-weight-medium);
}

.file-manager__tree-toggle {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.file-manager__tree-item--expanded .file-manager__tree-toggle {
  transform: rotate(90deg);
}

.file-manager__main {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-manager__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-color-light);
}

.file-manager__breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 13px;
}

.file-manager__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-4);
  padding: var(--space-5);
  overflow-y: auto;
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-5) var(--space-4);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.file-item:hover {
  background: var(--bg-surface-secondary);
}

.file-item--selected {
  background: var(--primary-lt);
  box-shadow: 0 0 0 2px var(--primary);
}

.file-item__icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--space-3);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  background: var(--bg-surface-secondary);
}

.file-item__icon--folder {
  background: var(--yellow-lt);
  color: var(--yellow);
}

.file-item__name {
  font-size: 12px;
  color: var(--text);
  word-break: break-word;
  max-width: 100%;
}

.file-item__meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: var(--space-1);
}
```

### 9.3 Chat

```css
.chat-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: calc(100vh - 180px);
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.chat-sidebar {
  border-right: 1px solid var(--border-color-light);
  display: flex;
  flex-direction: column;
}

.chat-sidebar__search {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-color-light);
}

.chat-sidebar__list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0;
}

.chat-thread {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid var(--border-color-light);
}

.chat-thread:hover {
  background: var(--bg-surface-secondary);
}

.chat-thread--active {
  background: var(--primary-lt);
}

.chat-thread__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.chat-thread__info {
  flex: 1;
  min-width: 0;
}

.chat-thread__name {
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  color: var(--text);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-thread__time {
  font-size: 11px;
  color: var(--text-muted);
}

.chat-thread__preview {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.chat-thread__unread {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--primary);
  color: #fff;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-main {
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-color-light);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.chat-message {
  display: flex;
  gap: var(--space-3);
  max-width: 70%;
}

.chat-message--own {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.chat-message__bubble {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: 13px;
  line-height: 1.5;
  color: var(--text);
}

.chat-message:not(.chat-message--own) .chat-message__bubble {
  background: var(--bg-surface-secondary);
  border-bottom-left-radius: var(--radius-sm);
}

.chat-message--own .chat-message__bubble {
  background: var(--primary);
  color: #fff;
  border-bottom-right-radius: var(--radius-sm);
}

.chat-message__time {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: var(--space-1);
  text-align: right;
}

.chat-input {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border-color-light);
}

.chat-input__field {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-color);
  border-radius: 100px;
  font-size: 13px;
  outline: none;
  transition: all 0.15s;
}

.chat-input__field:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-lt);
}
```

---

## 10. MODO OSCURO (Dark Mode)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --body-bg: #0f1720;
    --bg-surface: #1a2332;
    --bg-surface-secondary: #141d2b;

    --border-color: #2a3441;
    --border-color-light: #1f2937;
    --border-translucent: rgba(255, 255, 255, 0.06);

    --text: #e8ecf1;
    --text-secondary: #9aa5b5;
    --text-muted: #6b7a8e;
    --text-disabled: #4a5568;

    --shadow: rgba(0, 0, 0, 0.3) 0 2px 4px 0;
    --shadow-card: 0 0 0 1px var(--border-translucent), rgba(0, 0, 0, 0.3) 0 2px 8px 0;
    --shadow-dropdown: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .card,
  .stat-card,
  .auth-card,
  .calendar,
  .file-manager__sidebar,
  .file-manager__main,
  .chat-layout,
  .invoice {
    background: var(--bg-surface);
  }

  .table tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .form-input,
  .form-select,
  .form-textarea {
    background: var(--bg-surface-secondary);
    border-color: var(--border-color);
    color: var(--text);
  }
}
```

---

## 11. UTILIDADES Y HELPERS

```css
/* Display */
.d-none {
  display: none !important;
}
.d-block {
  display: block !important;
}
.d-flex {
  display: flex !important;
}
.d-inline-flex {
  display: inline-flex !important;
}
.d-grid {
  display: grid !important;
}

/* Flex */
.flex-1 {
  flex: 1 !important;
}
.flex-column {
  flex-direction: column !important;
}
.items-center {
  align-items: center !important;
}
.justify-between {
  justify-content: space-between !important;
}
.justify-end {
  justify-content: flex-end !important;
}
.gap-2 {
  gap: var(--space-2) !important;
}
.gap-3 {
  gap: var(--space-3) !important;
}
.gap-4 {
  gap: var(--space-4) !important;
}

/* Espaciado */
.m-0 {
  margin: 0 !important;
}
.mt-4 {
  margin-top: var(--space-4) !important;
}
.mb-4 {
  margin-bottom: var(--space-4) !important;
}
.p-0 {
  padding: 0 !important;
}
.p-4 {
  padding: var(--space-4) !important;
}
.p-5 {
  padding: var(--space-5) !important;
}

/* Texto */
.text-center {
  text-align: center !important;
}
.text-right {
  text-align: right !important;
}
.text-sm {
  font-size: 12px !important;
}
.text-muted {
  color: var(--text-muted) !important;
}
.text-primary {
  color: var(--primary) !important;
}
.text-danger {
  color: var(--red) !important;
}
.font-medium {
  font-weight: var(--font-weight-medium) !important;
}
.font-semibold {
  font-weight: var(--font-weight-semibold) !important;
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Bordes */
.rounded {
  border-radius: var(--radius) !important;
}
.rounded-lg {
  border-radius: var(--radius-lg) !important;
}

/* Overflow */
.overflow-hidden {
  overflow: hidden !important;
}
.overflow-auto {
  overflow: auto !important;
}

/* Cursor */
.cursor-pointer {
  cursor: pointer !important;
}

/* Animaciones */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease forwards;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Skeleton loading */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--border-color-light) 25%,
    var(--border-color) 50%,
    var(--border-color-light) 75%
  );
  background-size: 200% 100%;
  animation: skeleton 1.5s infinite;
  border-radius: var(--radius-sm);
}

@keyframes skeleton {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

---

## 12. SCSS AGREGADOR (`main.scss`)

```scss
// Gentelella v4 — Main SCSS aggregator
// =====================================

@use 'tokens';
@use 'layout';
@use 'components';
@use 'forms';
@use 'widgets';
@use 'pages';
@use 'datatable';
@use 'auth';
@use 'apps';
```

---

## 📋 Notas de Implementación

1. **Fuente:** Importar `Inter` desde Google Fonts:

   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link
     href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
     rel="stylesheet"
   />
   ```

2. **Iconos:** Usar el sistema de iconos incluido (120+ iconos en 14 categorías) o Font Awesome como alternativa.

3. **Variables CSS:** Todo el tema es configurable editando las custom properties en `:root`.

4. **Build:** El proyecto usa Vite 8 con SCSS. Para compilar:
   ```bash
   npm install
   npm run dev      # Desarrollo
   npm run build    # Producción
   ```
