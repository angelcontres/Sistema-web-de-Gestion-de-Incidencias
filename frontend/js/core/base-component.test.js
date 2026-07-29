import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BaseComponent } from './base-component.js';

describe('BaseComponent', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    delete global.fetch;
    jest.restoreAllMocks();
  });

  it('carga template desde templateUrl en connectedCallback', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => '<h1>Hola</h1>'
    });
    customElements.define('test-load', class extends BaseComponent {
      constructor() { super('/templates/test.html'); }
    });
    const el = document.createElement('test-load');
    document.body.appendChild(el);
    await new Promise(process.nextTick);
    expect(fetchMock).toHaveBeenCalledWith('/templates/test.html', { cache: 'no-store' });
    expect(el.innerHTML).toBe('<h1>Hola</h1>');
    document.body.removeChild(el);
  });

  it('llama onInit despues de renderizar template', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => '<p>content</p>'
    });
    const onInit = jest.fn();
    customElements.define('test-init', class extends BaseComponent {
      constructor() { super('/templates/test.html'); }
      onInit() { onInit(); }
    });
    const el = document.createElement('test-init');
    document.body.appendChild(el);
    await new Promise(process.nextTick);
    expect(onInit).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('muestra error en el DOM si fetch falla', async () => {
    fetchMock.mockRejectedValue(new Error('Not found'));
    customElements.define('test-error', class extends BaseComponent {
      constructor() { super('/templates/missing.html'); }
    });
    const el = document.createElement('test-error');
    document.body.appendChild(el);
    await new Promise(process.nextTick);
    expect(el.innerHTML).toContain('No se pudo renderizar la plantilla');
    document.body.removeChild(el);
  });

  it('loggea error si respuesta HTTP no es ok pero renderiza el body igual', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => '<h1>pagina 404</h1>'
    });
    customElements.define('test-http-error', class extends BaseComponent {
      constructor() { super('/templates/404.html'); }
    });
    const el = document.createElement('test-http-error');
    document.body.appendChild(el);
    await new Promise(process.nextTick);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('No se pudo cargar la plantilla')
    );
    expect(el.innerHTML).toBe('<h1>pagina 404</h1>');
    document.body.removeChild(el);
  });

  it('llama onDestroy cuando el elemento se desconecta', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => '<span>ok</span>'
    });
    const onDestroy = jest.fn();
    customElements.define('test-destroy', class extends BaseComponent {
      constructor() { super('/templates/destroy.html'); }
      onDestroy() { onDestroy(); }
    });
    const el = document.createElement('test-destroy');
    document.body.appendChild(el);
    await new Promise(process.nextTick);
    document.body.removeChild(el);
    expect(onDestroy).toHaveBeenCalled();
  });

  it('no lanza error si onDestroy no esta definido', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => '<span>ok</span>'
    });
    customElements.define('test-no-destroy', class extends BaseComponent {
      constructor() { super('/templates/simple.html'); }
    });
    const el = document.createElement('test-no-destroy');
    document.body.appendChild(el);
    await new Promise(process.nextTick);
    expect(() => document.body.removeChild(el)).not.toThrow();
  });
});
