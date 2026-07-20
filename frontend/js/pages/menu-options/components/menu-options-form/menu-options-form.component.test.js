import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MenuOptionsFormComponent } from './menu-options-form.component.js';
import { MenuOptionService } from '../../services/menu-option.service.js';

const TEMPLATE_HTML = `
  <form id="opcionMenuForm">
    <h5 id="formTitle"></h5>
    <input id="nombre" value="" />
    <input id="ruta" value="" />
    <input id="icono" value="" />
    <span id="icono-preview"></span>
    <select id="padre_id"></select>
    <div id="alertMessage" class="d-none"></div>
    <button id="btnGuardar"></button>
    <div id="loadingSpinner" class="d-none"></div>
  </form>
`;

describe('MenuOptionsFormComponent', () => {
  let component;

  beforeEach(() => {
    window.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(TEMPLATE_HTML) })
    );
    // jsdom doesn't implement scrollIntoView — polyfill it
    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    jest.spyOn(MenuOptionService, 'getById').mockResolvedValue({
      data: { id: 1, nombre: 'Menu 1', ruta: '/menu1', icono: 'bi-house', padre_id: null }
    });
    jest.spyOn(MenuOptionService, 'getAll').mockResolvedValue({ data: [] });
    jest.spyOn(MenuOptionService, 'create').mockResolvedValue({ message: 'Creado' });
    jest.spyOn(MenuOptionService, 'update').mockResolvedValue({ message: 'Actualizado' });

    document.body.innerHTML = `<app-menu-options-form></app-menu-options-form>`;
    component = document.querySelector('app-menu-options-form');

    window.location.hash = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    delete window.fetch;
    delete window.HTMLElement.prototype.scrollIntoView;
    window.location.hash = '';
  });

  it('onInit - inicializa el formulario y carga opciones padre', async () => {
    await component.onInit();
    // Let the floating init() promise settle
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

    expect(MenuOptionService.getAll).toHaveBeenCalled();
  });

  it('onInit - carga detalles si hay ID en la URL', async () => {
    window.location.hash = '#/form?id=1';

    await component.onInit();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

    expect(MenuOptionService.getById).toHaveBeenCalledWith('1');
    expect(component.querySelector('#nombre').value).toBe('Menu 1');
  });

  it('submit del formulario crea un nuevo registro', async () => {
    window.location.hash = '#/form';

    await component.onInit();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

    component.querySelector('#nombre').value = 'Nuevo';
    component.querySelector('#ruta').value = '/nuevo';
    component.querySelector('#icono').value = 'bi-house';

    const form = component.querySelector('#opcionMenuForm');
    form.checkValidity = jest.fn(() => true);

    // Trigger submit
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

    expect(MenuOptionService.create).toHaveBeenCalledWith({
      nombre: 'Nuevo',
      icono: 'bi-house',
      ruta: '/nuevo',
      padre_id: null
    });
  });
});
