import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('ModalComponent', () => {
  let ModalComponent, fetchMock;

  const TEMPLATE = `
    <div class="modal fade">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 id="modal-title"></h5>
          </div>
          <div id="modal-body" class="modal-body"></div>
          <div class="modal-footer">
            <button id="modal-btn-cancel">Cancelar</button>
            <button id="modal-btn-confirm">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  function mockBootstrapModal() {
    const mockHide = jest.fn();
    const mockShow = jest.fn();
    global.bootstrap = {
      Modal: jest.fn(() => ({ show: mockShow, hide: mockHide })),
    };
    return { mockHide, mockShow };
  }

  beforeAll(async () => {
    const mod = await import('./modal.component.js');
    ModalComponent = mod.ModalComponent;
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
    const el = document.createElement('app-modal');
    document.body.appendChild(el);
    await new Promise(process.nextTick);
    expect(el.isReady).toBe(true);
    expect(el.querySelector('#modal-title')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('show sets title, message and calls bootstrap.Modal', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TEMPLATE });
    const { mockHide, mockShow } = mockBootstrapModal();
    const el = document.createElement('app-modal');
    document.body.appendChild(el);
    await new Promise(process.nextTick);

    const promise = el.show({ title: 'Test Title', message: 'Test Body' });
    await new Promise(process.nextTick);

    expect(el.querySelector('#modal-title').innerHTML).toBe('Test Title');
    expect(el.querySelector('#modal-body').innerHTML).toBe('Test Body');
    expect(global.bootstrap.Modal).toHaveBeenCalled();
    expect(mockShow).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('show applies custom button text and class', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TEMPLATE });
    mockBootstrapModal();
    const el = document.createElement('app-modal');
    document.body.appendChild(el);
    await new Promise(process.nextTick);

    el.show({
      title: 'Confirm',
      message: 'Are you sure?',
      confirmText: 'Yes',
      cancelText: 'No',
      btnClass: 'btn-danger',
    });
    await new Promise(process.nextTick);

    expect(el.querySelector('#modal-btn-confirm').textContent).toBe('Yes');
    expect(el.querySelector('#modal-btn-cancel').textContent).toBe('No');
    expect(el.querySelector('#modal-btn-confirm').className).toContain('btn-danger');
    document.body.removeChild(el);
  });

  it('show resolves with true when confirm clicked', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TEMPLATE });
    const { mockHide } = mockBootstrapModal();
    const el = document.createElement('app-modal');
    document.body.appendChild(el);
    await new Promise(process.nextTick);

    const promise = el.show({ title: 'Test' });
    await new Promise(process.nextTick);
    el.querySelector('#modal-btn-confirm').click();
    expect(mockHide).toHaveBeenCalled();

    const modalEl = el.querySelector('.modal');
    modalEl.dispatchEvent(new Event('hidden.bs.modal'));
    const result = await promise;
    expect(result).toBe(true);
    expect(document.body.contains(el)).toBe(false);
  });

  it('show resolves with false when dismissed without confirm', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TEMPLATE });
    mockBootstrapModal();
    const el = document.createElement('app-modal');
    document.body.appendChild(el);
    await new Promise(process.nextTick);

    const promise = el.show({ title: 'Test' });
    await new Promise(process.nextTick);
    const modalEl = el.querySelector('.modal');
    modalEl.dispatchEvent(new Event('hidden.bs.modal'));
    const result = await promise;
    expect(result).toBe(false);
  });

  it('show uses empty defaults when no options passed', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => TEMPLATE });
    mockBootstrapModal();
    const el = document.createElement('app-modal');
    document.body.appendChild(el);
    await new Promise(process.nextTick);

    const promise = el.show();
    await new Promise(process.nextTick);
    expect(el.querySelector('#modal-title').innerHTML).toBe('');
    expect(el.querySelector('#modal-body').innerHTML).toBe('');
    el.querySelector('.modal').dispatchEvent(new Event('hidden.bs.modal'));
    await promise;
  });
});
