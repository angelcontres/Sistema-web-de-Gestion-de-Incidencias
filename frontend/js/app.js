/**
 * Frontend Main Application Entry Point
 * Imports all Web Components (Angular-like structure) and initializes the routing engine.
 */

// Import Global Components
import './components/navbar/navbar.component.js';
import './components/stats-card.js'; // Reusable small card component
import './components/sidebar/sidebar.component.js';

// Import Pages (Features)
import './pages/dashboard/dashboard.component.js';
import './pages/login/login.component.js';

import './pages/menu-options/components/menu-options-list/menu-options-list.component.js';
import './pages/menu-options/components/menu-options-form/menu-options-form.component.js';

import './pages/role/component/index/role-index.component.js';
import './pages/permissions/components/index/permission-index.component.js';
// Import and Initialize Router
import { initRouter } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  console.log('SPA Frontend (Arquitectura modular Angular-like) inicializada.');
});
