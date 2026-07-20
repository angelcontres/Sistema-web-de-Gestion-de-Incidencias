/**
 * Frontend Main Application Entry Point
 * Imports all Web Components (Angular-like structure) and initializes the routing engine.
 */

// Import Global Components
import './components/navbar/navbar.component.js';
import './components/stats-card.js'; // Reusable small card component
import './components/sidebar/sidebar.component.js';
import './components/menu-lobby/menu-lobby.component.js';

// Import Pages (Features)
import './pages/dashboard/components/dashboard-index/dashboard.component.js';
import './pages/login/login.component.js';

import './pages/menu-options/components/menu-options-list/menu-options-list.component.js';
import './pages/menu-options/components/menu-options-form/menu-options-form.component.js';
import './pages/user/components/index/user-index.component.js';
import './pages/user/components/form/user-form.component.js';

import './pages/role/component/index/role-index.component.js';
import './pages/permissions/components/index/permission-index.component.js';
import './pages/trp-dashboard/trp-dashboard.component.js';
import './pages/permissions/components/form/permission-form.component.js';
import './pages/ubicaciones/components/index/ubicaciones-index.component.js';
import './pages/categorias/components/index/categorias-index.component.js';
import './pages/incidencias/components/lobby/index/incidencia-index.component.js';
import './pages/incidencias/components/lobby/form/incidencia-form.component.js';
import './pages/incidencias/components/supervisor/incidencia-supervisor-index.component.js';
import './pages/incidencias/components/estado-individual-incidencia/estado-individual-incidencia-index.component.js';
import './pages/incidencias/components/historial/historial-index.component.js';
import './pages/instituciones/components/index/institucion-index.component.js';
import './pages/instituciones/components/form/institucion-form.component.js';
import './pages/institucion/kanban/kanban-index.component.js';
import './shared/components/app-data-table/app-data-table.component.js';
import './shared/components/modal/modal.component.js';
import './shared/components/toast/toast.component.js';
// Import and Initialize Router
import { initRouter } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  console.log('SPA Frontend (Arquitectura modular Angular-like) inicializada.');
});
