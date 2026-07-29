import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('ToastComponent', () => {
  let fetchMock;

  const TEMPLATE = `
    <div class="toast">
      <div class="toast-header">
        <i id="toast-icon"></i>
        <strong id="toast-title"></strong>
      </div>
      <div id="toast-message" class="toast-body"></div>
    </div>
  `;

  function mockBootstrapToast() {
    const mockShow = jest.fn();
    global.bootstrap = {
      Toast: jest.fn(() => ({ show: mockShow })),
    };
    return { mockShow };
  }

  beforeAll(async () => {
    await import('./toast.component.js');
  });

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    delete global.fetch;
    delete global.bootstrap;
    document.body.innerHTML = '';
  });

  it('creates element and sets isReady after template load', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TEMPLATE });
    const el = document.createElement('app-toast');
    document.body.appendChild(el);
    await new Promise(process.nextTick);
    expect(el.isReady).toBe(true);
    document.body.removeChild(el);
  });

  it('show success sets correct icon and default title', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TEMPLATE });
    mockBootstrapToast();
    const el = document.createElement('app-toast');
    document.body.appendChild(el);
    await new Promise(process.nextTick);

    await el.show('success', 'Operación exitosa');
    expect(el.querySelector('#toast-icon').classList).toContain('bi-check-circle-fill');
    expect(el.querySelector('#toast-icon').classList).toContain('text-success');
    expect(el.querySelector('#toast-title').textContent).toBe('Éxito');
    expect(el.querySelector('#toast-message').innerHTML).toBe('Operación exitosa');
    document.body.removeChild(el);
  });

  it('show error sets correct icon and default title', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TEMPLATE });
    mockBootstrapToast();
    const el = document.createElement('app-toast');
    document.body.appendChild(el);
    await new Promise(process.nextTick);

    await el.show('error', 'Algo salió mal');
    expect(el.querySelector('#toast-icon').classList).toContain('bi-exclamation-triangle-fill');
    expect(el.querySelector('#toast-icon').classList).toContain('text-danger');
    expect(el.querySelector('#toast-title').textContent).toBe('Error');
    document.body.removeChild(el);
  });

  it('show warning sets correct icon and default title', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TEMPLATE });
    mockBootstrapToast();
    const el = document.createElement('app-toast');
    document.body.appendChild(el);
    await new Promise(process.nextTick);

    await el.show('warning', 'Cuidado');
    expect(el.querySelector('#toast-icon').classList).toContain('bi-exclamation-circle-fill');
    expect(el.querySelector('#toast-icon').classList).toContain('text-warning');
    expect(el.querySelector('#toast-title').textContent).toBe('Advertencia');
    document.body.removeChild(el);
  });

  it('show info sets correct icon and default title', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TEMPLATE });
    mockBootstrapToast();
    const el = document.createElement('app-toast');
    document.body.appendChild(el);
    await new Promise(process.nextTick);

    await el.show('info', 'Información');
    expect(el.querySelector('#toast-icon').classList).toContain('bi-info-circle-fill');
    expect(el.querySelector('#toast-icon').classList).toContain('text-primary');
    expect(el.querySelector('#toast-title').textContent).toBe('Información');
    document.body.removeChild(el);
  });

  it('show uses custom title', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TEMPLATE });
    mockBootstrapToast();
    const el = document.createElement('app-toast');
    document.body.appendChild(el);
    await new Promise(process.nextTick);

    await el.show('success', 'Mensaje', 'Personalizado');
    expect(el.querySelector('#toast-title').textContent).toBe('Personalizado');
    document.body.removeChild(el);
  });

  it('show removes element after toast hides', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TEMPLATE });
    mockBootstrapToast();
    const el = document.createElement('app-toast');
    document.body.appendChild(el);
    await new Promise(process.nextTick);

    el.show('info', 'test');
    await new Promise(process.nextTick);
    const toastEl = el.querySelector('.toast');
    toastEl.dispatchEvent(new Event('hidden.bs.toast'));

    expect(document.body.contains(el)).toBe(false);
  });
});
