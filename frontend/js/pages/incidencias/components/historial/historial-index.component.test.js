import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { HistorialIndexComponent } from './historial-index.component.js';
import { IncidenciaService } from '../../services/incidencia.service.js';

describe('HistorialIndexComponent', () => {
  beforeEach(() => {
    window.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<div id="tbl-historial-incidencias"></div>'),
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function createMockComponent() {
    const component = new HistorialIndexComponent();
    const fakeElements = {};

    component.querySelector = jest.fn((selector) => {
      if (selector === '#tbl-historial-incidencias') {
        if (!fakeElements[selector]) {
          fakeElements[selector] = {
            configure: jest.fn(),
            load: jest.fn(),
            addEventListener: jest.fn(),
          };
        }
      }
      return fakeElements[selector];
    });

    return { component, fakeElements };
  }

  it('onInit - debería configurar la tabla y cargar datos', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();

    const tblDatos = fakeElements['#tbl-historial-incidencias'];
    expect(tblDatos.configure).toHaveBeenCalled();
    expect(tblDatos.load).toHaveBeenCalledWith(IncidenciaService.getAll);

    // Get the configuration object
    const config = tblDatos.configure.mock.calls[0][0];
    const columns = config.columns;

    const clasificacionColumn = columns.find((c) => c.header === 'Clasificación');
    expect(
      clasificacionColumn.render({ tipo: { nombre: 'Tipo1' }, subTipo: { nombre: 'SubTipo1' } })
    ).toContain('Tipo1');
    expect(
      clasificacionColumn.render({ tipo: { nombre: 'Tipo2' }, sub_tipo: { nombre: 'SubTipo2' } })
    ).toContain('SubTipo2');
    expect(clasificacionColumn.render({})).toContain('-');

    const descColumn = columns.find((c) => c.header === 'Descripción');
    expect(descColumn.render({ incidencia_descripcion: 'Desc' })).toContain('Desc');
    expect(descColumn.render({})).toContain('Sin descripción.');

    const ubiColumn = columns.find((c) => c.header === 'Ubicación');
    expect(
      ubiColumn.render({ direccion: { detalle: 'Dir', territorio: { pais: { nombre: 'Peru' } } } })
    ).toContain('Peru');
    expect(ubiColumn.render({})).toContain('Sin dirección.');

    const prioColumn = columns.find((c) => c.header === 'Prioridad');
    expect(prioColumn.render({ prioridad: { nombre: 'Alta', color_hex: '#ff0000' } })).toContain(
      'Alta'
    );
    expect(prioColumn.render({ prioridad: { nombre: 'Media' } })).toContain('Media');
    expect(prioColumn.render({})).toBe('-');

    const estadoColumn = columns.find((c) => c.header === 'Estado');
    expect(estadoColumn.render({ estado: { nombre: 'Nuevo' } })).toContain('Nuevo');
    expect(estadoColumn.render({})).toBe('-');

    const detalleColumn = columns.find((c) => c.header === 'Detalle cronológico');
    expect(detalleColumn.render({})).toContain('<button');
  });

  it('onInit - row-action detalle debería redireccionar', async () => {
    const { component, fakeElements } = createMockComponent();

    let eventCallback;
    fakeElements['#tbl-historial-incidencias'] = {
      configure: jest.fn(),
      load: jest.fn(),
      addEventListener: jest.fn((event, cb) => {
        if (event === 'row-action') eventCallback = cb;
      }),
    };

    await component.onInit();

    // Simulate event
    const originalHash = window.location.hash;
    eventCallback({ detail: { action: 'detalle', item: { id: 99 } } });

    expect(window.location.hash).toBe('#/tramites/estado-individual?id=99');

    // Test different action
    eventCallback({ detail: { action: 'other', item: { id: 99 } } });
    expect(window.location.hash).toBe('#/tramites/estado-individual?id=99');

    window.location.hash = originalHash;
  });
});
