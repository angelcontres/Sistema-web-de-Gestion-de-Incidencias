import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const mockMenuOptionService = {
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

jest.unstable_mockModule('../../services/menu-option.service.js', () => ({
  MenuOptionService: mockMenuOptionService,
}));

const { MenuOptionsFormComponent } = await import('./menu-options-form.component.js');

const TEMPLATE_HTML = `
  <form id="opcionMenuForm">
    <h5 id="formTitle">Nueva Opción de Menú</h5>
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
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    window.location.hash = '';
    mockMenuOptionService.getAll.mockReset();
    mockMenuOptionService.getById.mockReset();
    mockMenuOptionService.create.mockReset();
    mockMenuOptionService.update.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.HTMLElement.prototype.scrollIntoView;
    window.location.hash = '';
  });

  it('1. Component is defined as custom element', () => {
    expect(customElements.get('app-menu-options-form')).toBe(MenuOptionsFormComponent);
  });

  describe('actualizarVistaPreviaIcono', () => {
    describe('actualizarVistaPreviaIcono', () => {
      it.each([
        { valor: '', claseEsperada: 'bi bi-tag', descripcion: 'empty value sets fallback class' },
        {
          valor: 'bi-gear',
          claseEsperada: 'bi bi-gear',
          descripcion: 'value starting with "bi-" sets correct class',
        },
        {
          valor: 'gear',
          claseEsperada: 'bi bi-gear',
          descripcion: 'value without "bi-" prefix prepends "bi bi-"',
        },
      ])('$descripcion', ({ valor, claseEsperada }) => {
        const component = new MenuOptionsFormComponent();
        const el = document.createElement('span');

        component.actualizarVistaPreviaIcono(valor, el);

        expect(el.className).toBe(claseEsperada);
      });
    });

    it('5. iconoPreviewEl missing does nothing', () => {
      const component = new MenuOptionsFormComponent();
      expect(() => {
        component.actualizarVistaPreviaIcono('bi-gear', null);
      }).not.toThrow();
    });
  });

  describe('poblarCamposFormulario', () => {
    it('6. fills form fields and calls actualizarVistaPreviaIcono', () => {
      const component = new MenuOptionsFormComponent();
      component.innerHTML = TEMPLATE_HTML;
      const actSpy = jest.spyOn(component, 'actualizarVistaPreviaIcono');
      const selectPadre = component.querySelector('#padre_id');
      const iconoPreviewEl = component.querySelector('#icono-preview');
      const opcion = { nombre: 'TestName', ruta: '/test', icono: 'bi-house', padre_id: null };

      component.poblarCamposFormulario(opcion, selectPadre, iconoPreviewEl);

      expect(component.querySelector('#nombre').value).toBe('TestName');
      expect(component.querySelector('#ruta').value).toBe('/test');
      expect(component.querySelector('#icono').value).toBe('bi-house');
      expect(actSpy).toHaveBeenCalledWith('bi-house', iconoPreviewEl);
      expect(iconoPreviewEl.className).toBe('bi bi-house');
    });

    it('7. handles missing input elements gracefully', () => {
      const component = new MenuOptionsFormComponent();
      component.innerHTML = '<div></div>';
      expect(() => {
        component.poblarCamposFormulario(
          { nombre: 'Test', ruta: '/test', icono: 'bi-test', padre_id: 3 },
          null,
          null
        );
      }).not.toThrow();
    });

    it('8. sets parent select value when padre_id exists', () => {
      const component = new MenuOptionsFormComponent();
      component.innerHTML = TEMPLATE_HTML;
      const selectPadre = component.querySelector('#padre_id');
      selectPadre.innerHTML = '<option value="3">Parent (/)</option>';
      const iconoPreviewEl = component.querySelector('#icono-preview');

      component.poblarCamposFormulario(
        { nombre: 'Child', ruta: '/child', icono: 'bi-child', padre_id: 3 },
        selectPadre,
        iconoPreviewEl
      );

      expect(selectPadre.value).toBe('3');
    });
  });

  describe('configurarEncabezadoEdicion', () => {
    it('9. updates document.title and formTitleEl', () => {
      const component = new MenuOptionsFormComponent();
      const formTitleEl = document.createElement('h5');
      component.configurarEncabezadoEdicion(formTitleEl);
      expect(document.title).toBe('Editar Opción de Menú');
      expect(formTitleEl.textContent).toBe('Editar Opción de Menú');
    });
  });

  describe('onInit', () => {
    beforeEach(() => {
      window.location.hash = '';
    });

    it('10. new mode: loads parent options, no edit data load', async () => {
      mockMenuOptionService.getAll.mockResolvedValue({ data: [] });
      const component = new MenuOptionsFormComponent();
      component.innerHTML = TEMPLATE_HTML;
      await component.onInit();
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      expect(mockMenuOptionService.getAll).toHaveBeenCalledWith(1, 15, null, { all: true });
      expect(mockMenuOptionService.getById).not.toHaveBeenCalled();
    });

    it('11. edit mode: loads parent options AND edit data, populates form', async () => {
      window.location.hash = '#/opciones-menu/form?id=5';
      mockMenuOptionService.getAll.mockResolvedValue({ data: [] });
      mockMenuOptionService.getById.mockResolvedValue({
        data: { id: 5, nombre: 'EditName', ruta: '/edit', icono: 'bi-pencil', padre_id: null },
      });

      const component = new MenuOptionsFormComponent();
      component.innerHTML = TEMPLATE_HTML;
      await component.onInit();
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      expect(mockMenuOptionService.getById).toHaveBeenCalledWith('5');
      expect(component.querySelector('#nombre').value).toBe('EditName');
      expect(document.title).toBe('Editar Opción de Menú');
    });

    it('12. form submit creates new option on success', async () => {
      mockMenuOptionService.getAll.mockResolvedValue({ data: [] });
      mockMenuOptionService.create.mockResolvedValue({
        message: 'Opción de menú creada con éxito.',
      });

      const component = new MenuOptionsFormComponent();
      component.innerHTML = TEMPLATE_HTML;
      await component.onInit();
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      component.querySelector('#nombre').value = 'Nuevo';
      component.querySelector('#ruta').value = '/nuevo';
      component.querySelector('#icono').value = 'bi-star';
      const form = component.querySelector('#opcionMenuForm');
      form.checkValidity = jest.fn(() => true);

      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      expect(mockMenuOptionService.create).toHaveBeenCalledWith({
        nombre: 'Nuevo',
        icono: 'bi-star',
        ruta: '/nuevo',
        padre_id: null,
      });
      const alertMessage = component.querySelector('#alertMessage');
      expect(alertMessage.textContent).toBe('Opción de menú creada con éxito.');
      expect(alertMessage.classList.contains('alert-success')).toBe(true);
      expect(alertMessage.classList.contains('d-none')).toBe(false);
    });

    it('13. form submit updates existing option on success', async () => {
      window.location.hash = '#/opciones-menu/form?id=5';
      mockMenuOptionService.getAll.mockResolvedValue({ data: [] });
      mockMenuOptionService.getAll.mockResolvedValue({
        data: [{ id: 3, nombre: 'Parent', ruta: '/parent' }],
      });
      mockMenuOptionService.getById.mockResolvedValue({
        data: { id: 5, nombre: 'Old', ruta: '/old', icono: 'bi-old', padre_id: 3 },
      });
      mockMenuOptionService.update.mockResolvedValue({
        message: 'Opción de menú actualizada con éxito.',
      });

      const component = new MenuOptionsFormComponent();
      component.innerHTML = TEMPLATE_HTML;
      await component.onInit();
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      component.querySelector('#nombre').value = 'Updated';
      const form = component.querySelector('#opcionMenuForm');
      form.checkValidity = jest.fn(() => true);

      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      expect(mockMenuOptionService.update).toHaveBeenCalledWith('5', {
        nombre: 'Updated',
        icono: 'bi-old',
        ruta: '/old',
        padre_id: 3,
      });
      const alertMessage = component.querySelector('#alertMessage');
      expect(alertMessage.textContent).toBe('Opción de menú actualizada con éxito.');
      expect(alertMessage.classList.contains('alert-success')).toBe(true);
    });

    it('14. form submit validation fails', async () => {
      mockMenuOptionService.getAll.mockResolvedValue({ data: [] });

      const component = new MenuOptionsFormComponent();
      component.innerHTML = TEMPLATE_HTML;
      await component.onInit();
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      const form = component.querySelector('#opcionMenuForm');
      form.checkValidity = jest.fn(() => false);

      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      expect(form.classList.contains('was-validated')).toBe(true);
      expect(mockMenuOptionService.create).not.toHaveBeenCalled();
      expect(mockMenuOptionService.update).not.toHaveBeenCalled();
    });

    it('15. form submit API error shows danger alert', async () => {
      mockMenuOptionService.getAll.mockResolvedValue({ data: [] });
      mockMenuOptionService.create.mockRejectedValue(new Error());

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const component = new MenuOptionsFormComponent();
      component.innerHTML = TEMPLATE_HTML;
      await component.onInit();
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      component.querySelector('#nombre').value = 'Test';
      const form = component.querySelector('#opcionMenuForm');
      form.checkValidity = jest.fn(() => true);

      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      const alertMessage = component.querySelector('#alertMessage');
      expect(alertMessage.classList.contains('alert-danger')).toBe(true);
      expect(alertMessage.textContent).toBe('Hubo un error inesperado al procesar la solicitud.');
      expect(component.querySelector('#btnGuardar').disabled).toBe(false);

      consoleSpy.mockRestore();
    });

    it('16. icono input event updates preview', async () => {
      mockMenuOptionService.getAll.mockResolvedValue({ data: [] });

      const component = new MenuOptionsFormComponent();
      component.innerHTML = TEMPLATE_HTML;
      const actSpy = jest.spyOn(component, 'actualizarVistaPreviaIcono');
      await component.onInit();
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      const iconoInput = component.querySelector('#icono');
      const iconoPreview = component.querySelector('#icono-preview');

      iconoInput.value = 'bi-save';
      iconoInput.dispatchEvent(new Event('input', { bubbles: true }));

      expect(actSpy).toHaveBeenCalledWith('bi-save', iconoPreview);
      expect(iconoPreview.className).toBe('bi bi-save');
    });

    it('17. cargarOpcionesPadre API error shows danger alert', async () => {
      mockMenuOptionService.getAll.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const component = new MenuOptionsFormComponent();
      component.innerHTML = TEMPLATE_HTML;
      await component.onInit();
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      const alertMessage = component.querySelector('#alertMessage');
      expect(alertMessage.classList.contains('alert-danger')).toBe(true);
      expect(alertMessage.textContent).toBe(
        'Error al conectar con el servidor para cargar las opciones del menú.'
      );

      consoleSpy.mockRestore();
    });

    it('18. cargarDatosEdicion API error shows danger alert and disables btnGuardar', async () => {
      window.location.hash = '#/opciones-menu/form?id=5';
      mockMenuOptionService.getAll.mockResolvedValue({ data: [] });
      mockMenuOptionService.getById.mockRejectedValue(new Error('Not found'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const component = new MenuOptionsFormComponent();
      component.innerHTML = TEMPLATE_HTML;
      await component.onInit();
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      const alertMessage = component.querySelector('#alertMessage');
      expect(alertMessage.textContent).toBe(
        'No se pudieron cargar los datos del registro a editar.'
      );
      expect(alertMessage.classList.contains('alert-danger')).toBe(true);
      expect(component.querySelector('#btnGuardar').disabled).toBe(true);

      consoleSpy.mockRestore();
    });

    it('19. after successful save, redirects to #/opciones-menu after 1500ms', async () => {
      mockMenuOptionService.getAll.mockResolvedValue({ data: [] });
      mockMenuOptionService.create.mockResolvedValue({ message: 'Creado.' });

      const component = new MenuOptionsFormComponent();
      component.innerHTML = TEMPLATE_HTML;
      await component.onInit();
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      const setTimeoutSpy = jest.spyOn(window, 'setTimeout').mockImplementation((cb) => {
        cb();
        return 0;
      });

      component.querySelector('#nombre').value = 'Test';
      const form = component.querySelector('#opcionMenuForm');
      form.checkValidity = jest.fn(() => true);

      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

      expect(setTimeoutSpy).toHaveBeenCalled();
      expect(window.location.hash).toBe('#/opciones-menu');
      setTimeoutSpy.mockRestore();
    });
  });
});
