import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../../../core/auth.service.js', () => ({
  AuthService: { isAdmin: jest.fn() },
}));

jest.unstable_mockModule('../paises/ubicaciones-paises.component.js', () => ({}));
jest.unstable_mockModule('../territorios/ubicaciones-territorios.component.js', () => ({}));
jest.unstable_mockModule('../direcciones/ubicaciones-direcciones.component.js', () => ({}));

let UbicacionesIndexComponent;
let AuthService;

async function flushPromises() {
  for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
}

beforeAll(async () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  const mod = await import('./ubicaciones-index.component.js');
  UbicacionesIndexComponent = mod.UbicacionesIndexComponent;
  AuthService = (await import('../../../../core/auth.service.js')).AuthService;
});

function newComponent(innerHTML) {
  const el = new UbicacionesIndexComponent();
  el.innerHTML = innerHTML;
  return el;
}

beforeEach(() => {
  jest.clearAllMocks();
  AuthService.isAdmin.mockReturnValue(true);
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    text: async () => '<div></div>',
  });
});

afterEach(() => {
  delete global.fetch;
});

describe('UbicacionesIndexComponent', () => {

  it('1 - Component is defined as custom element', () => {
    expect(customElements.get('app-ubicaciones-index')).toBe(UbicacionesIndexComponent);
  });

  it('2 - onInit() - admin user: paises tab visible, registers shown.bs.tab listener, does NOT activate direcciones pane', () => {
    const component = newComponent(`
      <div>
        <div><button id="paises-tab"></button></div>
        <div id="paises-pane"></div>
        <button id="direcciones-tab"></button>
        <div id="direcciones-pane">
          <app-ubicaciones-direcciones id="direccionesComponent"></app-ubicaciones-direcciones>
        </div>
      </div>
    `);
    const spyAdd = jest.spyOn(component.querySelector('#direcciones-tab'), 'addEventListener');
    component.onInit();
    const paisesTab = component.querySelector('#paises-tab');
    expect(paisesTab.parentElement.classList.contains('d-none')).toBe(false);
    const paisesPane = component.querySelector('#paises-pane');
    expect(paisesPane.classList.contains('d-none')).toBe(false);
    expect(spyAdd).toHaveBeenCalledWith('shown.bs.tab', expect.any(Function));
    const dirComponent = component.querySelector('#direccionesComponent');
    expect(dirComponent.initMainMap).toBeUndefined();
  });

  it('3 - onInit() - non-admin user: hides paises tab and pane', () => {
    AuthService.isAdmin.mockReturnValue(false);
    const component = newComponent(`
      <div>
        <div><button id="paises-tab"></button></div>
        <div id="paises-pane"></div>
        <button id="direcciones-tab"></button>
        <div id="direcciones-pane">
          <app-ubicaciones-direcciones id="direccionesComponent"></app-ubicaciones-direcciones>
        </div>
      </div>
    `);
    component.onInit();
    const paisesTab = component.querySelector('#paises-tab');
    expect(paisesTab.parentElement.classList.contains('d-none')).toBe(true);
    const paisesPane = component.querySelector('#paises-pane');
    expect(paisesPane.classList.contains('d-none')).toBe(true);
  });

  it('4 - onInit() - shown.bs.tab event calls initMainMap on direcciones component', () => {
    const component = newComponent(`
      <div>
        <button id="direcciones-tab"></button>
        <div id="direcciones-pane">
          <app-ubicaciones-direcciones id="direccionesComponent"></app-ubicaciones-direcciones>
        </div>
      </div>
    `);
    const dirComponent = component.querySelector('#direccionesComponent');
    dirComponent.initMainMap = jest.fn();
    component.onInit();
    const tab = component.querySelector('#direcciones-tab');
    tab.dispatchEvent(new Event('shown.bs.tab'));
    expect(dirComponent.initMainMap).toHaveBeenCalledTimes(1);
  });

  it('5 - onInit() - direcciones pane is active on load: setTimeout calls initMainMap', () => {
    jest.useFakeTimers();
    const component = newComponent(`
      <div>
        <button id="direcciones-tab"></button>
        <div id="direcciones-pane" class="active">
          <app-ubicaciones-direcciones id="direccionesComponent"></app-ubicaciones-direcciones>
        </div>
      </div>
    `);
    const dirComponent = component.querySelector('#direccionesComponent');
    dirComponent.initMainMap = jest.fn();
    component.onInit();
    jest.advanceTimersByTime(100);
    expect(dirComponent.initMainMap).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('6 - onInit() - direcciones-tab exists but no direccionesComponent: guard clause works', () => {
    const component = newComponent(`
      <div>
        <button id="direcciones-tab"></button>
        <div id="direcciones-pane"></div>
      </div>
    `);
    const spyAdd = jest.spyOn(component.querySelector('#direcciones-tab'), 'addEventListener');
    component.onInit();
    expect(spyAdd).toHaveBeenCalledWith('shown.bs.tab', expect.any(Function));
    const tab = component.querySelector('#direcciones-tab');
    expect(() => tab.dispatchEvent(new Event('shown.bs.tab'))).not.toThrow();
  });

  it('7 - onInit() - direccionesComponent exists but initMainMap is not a function: guard clause works', () => {
    const component = newComponent(`
      <div>
        <button id="direcciones-tab"></button>
        <div id="direcciones-pane">
          <app-ubicaciones-direcciones id="direccionesComponent"></app-ubicaciones-direcciones>
        </div>
      </div>
    `);
    component.onInit();
    const tab = component.querySelector('#direcciones-tab');
    expect(() => tab.dispatchEvent(new Event('shown.bs.tab'))).not.toThrow();
  });

  it('8 - onInit() - paises-tab/pane missing: guard clauses work (no crash)', () => {
    AuthService.isAdmin.mockReturnValue(false);
    const component = newComponent(`
      <div>
        <button id="direcciones-tab"></button>
        <div id="direcciones-pane"></div>
      </div>
    `);
    expect(() => component.onInit()).not.toThrow();
  });

});
