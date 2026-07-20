import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UbicacionesIndexComponent } from './ubicaciones-index.component.js';
import { AuthService } from '../../../../core/auth.service.js';
import { BaseComponent } from '../../../../core/base-component.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

describe('UbicacionesIndexComponent', () => {
  let component;

  beforeEach(() => {
    jest.spyOn(BaseComponent.prototype, 'connectedCallback').mockImplementation(() => {});
    jest.spyOn(ToastService, 'success').mockImplementation(() => {});
    jest.spyOn(ToastService, 'error').mockImplementation(() => {});
    
    // Define custom elements used internally if not defined
    if (!customElements.get('app-ubicaciones-paises')) {
      class DummyPaises extends HTMLElement {}
      customElements.define('app-ubicaciones-paises', DummyPaises);
    }
    if (!customElements.get('app-ubicaciones-territorios')) {
      class DummyTerritorios extends HTMLElement {}
      customElements.define('app-ubicaciones-territorios', DummyTerritorios);
    }
    if (!customElements.get('app-ubicaciones-direcciones')) {
      class DummyDirecciones extends HTMLElement {}
      customElements.define('app-ubicaciones-direcciones', DummyDirecciones);
    }

    document.body.innerHTML = `
      <app-ubicaciones-index></app-ubicaciones-index>
    `;
    
    component = document.querySelector('app-ubicaciones-index');
    component.innerHTML = `
      <div>
        <div id="paises-tab"></div>
      </div>
      <div id="paises-pane"></div>
      <div id="direcciones-tab"></div>
      <div id="direcciones-pane" class="active">
        <app-ubicaciones-direcciones id="direccionesComponent"></app-ubicaciones-direcciones>
      </div>
    `;

    jest.spyOn(AuthService, 'isAdmin').mockReturnValue(true);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('debería inicializarse correctamente y mantener visible paises si es admin', () => {
    component.onInit();
    
    const paisesPane = component.querySelector('#paises-pane');
    expect(paisesPane.classList.contains('d-none')).toBeFalsy();
  });

  it('debería ocultar paises tab y pane si no es admin', () => {
    AuthService.isAdmin.mockReturnValue(false);
    
    component.onInit();
    
    const paisesPane = component.querySelector('#paises-pane');
    expect(paisesPane.classList.contains('d-none')).toBeTruthy();
  });
});
