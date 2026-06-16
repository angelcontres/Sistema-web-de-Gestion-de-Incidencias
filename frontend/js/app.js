/**
 * Frontend Main Application Entry Point
 * Imports all Web Components (Angular-like structure) and initializes the routing engine.
 */

// Import Global Components
import './components/navbar/navbar.component.js';
import './components/sidebar/sidebar.component.js';
import './components/stats-card.js'; // Reusable small card component

// Import Pages (Features)
import './pages/dashboard/dashboard.component.js';
import './pages/login/login.component.js';
import './pages/opciones-menu/opciones-menu-lista.component.js';
import './pages/opciones-menu/opciones-menu-form.component.js';

// Import and Initialize Router
import { initRouter } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  console.log('SPA Frontend (Arquitectura modular Angular-like) inicializada.');
});
