import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UbicacionesTerritoriosComponent } from './ubicaciones-territorios.component.js';
import { UbicacionesService } from '../../services/ubicaciones.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';

const TEMPLATE = `
<div id="territorioModal">
  <h5 id="territorioModalLabel"></h5>
  <form id="territorioForm">
    <input id="territorioId" />
    <input id="territorioParentId" />
    <input id="territorioPaisId" />
    <label for="territorioNombre"></label>
    <input id="territorioNombre" />
    <div class="invalid-feedback"></div>
    <input id="territorioTipo" />
    <input type="checkbox" id="territorioActivo" />
    <button type="submit"></button>
  </form>
  <div id="territorioContextLabel"></div>
  <div id="territorioModalErrorAlert" class="d-none"></div>
  <div id="territorioModalErrorMessage"></div>
</div>
<select id="explorerPaisSelect"></select>
<button id="btnAddNivel1"></button>
<button id="btnAddNivel2"></button>
<button id="btnAddNivel3"></button>
<div id="listNivel1"></div>
<div id="listNivel2"></div>
<div id="listNivel3"></div>
<span id="lblNivel1"></span>
<span id="lblNivel2"></span>
<span id="lblNivel3"></span>
`;

function mockBootstrap() {
  window.bootstrap = { Modal: jest.fn(() => ({ show: jest.fn(), hide: jest.fn() })) };
}

const EC_PAIS = { id: 1, nombre: 'Ecuador', codigo_iso: 'EC', activo: true };
const NIVEL1 = { id: 10, nombre: 'Pichincha', tipo: 'Provincia', activo: true };
const NIVEL2 = { id: 20, nombre: 'Quito', tipo: 'Cantón', activo: true };
const NIVEL3 = { id: 30, nombre: 'Iñaquito', tipo: 'Parroquia', activo: true };

describe('UbicacionesTerritoriosComponent', () => {
  let component;

  function setupMocks(paises, territoriosFn) {
    window.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(TEMPLATE) })
    );
    document.body.innerHTML = '<app-ubicaciones-territorios></app-ubicaciones-territorios>';
    component = document.querySelector('app-ubicaciones-territorios');
    mockBootstrap();
    jest.spyOn(AuthService, 'isAdmin').mockReturnValue(true);
    jest.spyOn(UbicacionesService, 'getPaises').mockResolvedValue(paises || [EC_PAIS]);
    jest.spyOn(UbicacionesService, 'getTerritorios').mockImplementation(territoriosFn || (() => Promise.resolve([])));
    jest.spyOn(UbicacionesService, 'createTerritorio').mockResolvedValue({ id: 99 });
    jest.spyOn(UbicacionesService, 'updateTerritorio').mockResolvedValue({});
    jest.spyOn(UbicacionesService, 'deleteTerritorio').mockResolvedValue({});
    jest.spyOn(ToastService, 'success').mockImplementation(() => {});
    jest.spyOn(ToastService, 'error').mockImplementation(() => {});
    jest.spyOn(ModalService, 'confirm').mockResolvedValue(true);
  }

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    delete window.fetch;
  });

  it('deberia inicializar y cargar paises', async () => {
    setupMocks();
    await component.onInit();
    expect(UbicacionesService.getPaises).toHaveBeenCalled();
    expect(document.querySelector('#explorerPaisSelect').innerHTML).toContain('Ecuador');
  });

  it('deberia suscribirse al evento paises-updated', async () => {
    setupMocks([EC_PAIS], () => Promise.resolve([]));
    await component.onInit();
    document.dispatchEvent(new CustomEvent('paises-updated', {
      detail: { paises: [EC_PAIS, { id: 2, nombre: 'Peru', codigo_iso: 'PE', activo: true }] }
    }));
    expect(component.paisesList).toHaveLength(2);
  });

  it('deberia remover botones si no es admin', async () => {
    setupMocks();
    AuthService.isAdmin.mockReturnValue(false);
    await component.onInit();
    expect(component.querySelector('#btnAddNivel1')).toBeNull();
    expect(component.querySelector('#btnAddNivel2')).toBeNull();
    expect(component.querySelector('#btnAddNivel3')).toBeNull();
  });

  it('deberia cargar y renderizar columna 1', async () => {
    setupMocks([EC_PAIS], () => Promise.resolve([NIVEL1]));
    await component.onInit();
    await component.cargarTerritoriosColumna1();
    const list1 = component.querySelector('#listNivel1');
    expect(list1.innerHTML).toContain('Pichincha');
    expect(list1.innerHTML).toContain('Provincia');
  });

  it('deberia manejar error al cargar columna 1', async () => {
    setupMocks([EC_PAIS], () => Promise.reject(new Error('Network error')));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await component.onInit();
    await component.cargarTerritoriosColumna1();
    expect(console.error).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('deberia mostrar placeholder si no hay pais seleccionado', async () => {
    setupMocks([]);
    await component.onInit();
    await component.cargarTerritoriosColumna1();
    expect(component.querySelector('#listNivel1').innerHTML).toContain('Selecciona un pa');
  });

  it('deberia mostrar vacio si no hay territorios nivel 1', async () => {
    setupMocks([EC_PAIS], () => Promise.resolve([]));
    await component.onInit();
    const list1 = component.querySelector('#listNivel1');
    list1.innerHTML = '';
    component.territoriosNivel1 = [];
    component.renderColumna1();
    expect(list1.innerHTML).toContain('No hay territorios');
  });

  it('deberia seleccionar item en columna 1 y cargar columna 2', async () => {
    setupMocks([EC_PAIS], (page, perPage, cursor, params) => {
      if (params.parent_id === null) return Promise.resolve([NIVEL1]);
      if (params.parent_id === 10) return Promise.resolve([NIVEL2]);
      return Promise.resolve([]);
    });
    await component.onInit();
    component.selectedPaisId = 1;
    component.territoriosNivel1 = [NIVEL1];
    component.renderColumna1();
    const item = component.querySelector('#listNivel1 .list-group-item');
    item.click();
    expect(component.selectedNivel1Id).toBe(10);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(component.territoriosNivel2).toEqual([NIVEL2]);
  });

  it('deberia cargar y renderizar columna 2', async () => {
    setupMocks([EC_PAIS], () => Promise.resolve([NIVEL2]));
    await component.onInit();
    component.selectedNivel1Id = 10;
    await component.cargarTerritoriosColumna2();
    expect(component.territoriosNivel2).toEqual([NIVEL2]);
    expect(component.querySelector('#listNivel2').innerHTML).toContain('Quito');
  });

  it('deberia manejar error al cargar columna 2', async () => {
    setupMocks([EC_PAIS], () => Promise.reject(new Error('Error')));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await component.onInit();
    component.selectedNivel1Id = 10;
    await component.cargarTerritoriosColumna2();
    expect(console.error).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('deberia cargar y renderizar columna 3', async () => {
    setupMocks([EC_PAIS], () => Promise.resolve([NIVEL3]));
    await component.onInit();
    component.selectedNivel2Id = 20;
    await component.cargarTerritoriosColumna3();
    expect(component.territoriosNivel3).toEqual([NIVEL3]);
    expect(component.querySelector('#listNivel3').innerHTML).toContain('Iñaquito');
  });

  it('deberia manejar error al cargar columna 3', async () => {
    setupMocks([EC_PAIS], () => Promise.reject(new Error('Error')));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await component.onInit();
    component.selectedNivel2Id = 20;
    await component.cargarTerritoriosColumna3();
    expect(console.error).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('abrirModalTerritorio modo creacion nivel 1', async () => {
    setupMocks();
    await component.onInit();
    component.selectedPaisId = 1;
    component.abrirModalTerritorio(1);
    expect(document.querySelector('#territorioModalLabel').textContent).toContain('Provincia');
    expect(document.querySelector('#territorioParentId').value).toBe('');
  });

  it('abrirModalTerritorio modo creacion nivel 2', async () => {
    setupMocks([EC_PAIS], () => Promise.resolve([NIVEL1]));
    await component.onInit();
    component.selectedPaisId = 1;
    component.selectedNivel1Id = 10;
    component.territoriosNivel1 = [NIVEL1];
    component.abrirModalTerritorio(2);
    expect(document.querySelector('#territorioModalLabel').textContent).toContain('Cantón');
    expect(document.querySelector('#territorioParentId').value).toBe('10');
  });

  it('abrirModalTerritorio modo creacion nivel 3', async () => {
    setupMocks([EC_PAIS], () => Promise.resolve([NIVEL1, NIVEL2]));
    await component.onInit();
    component.selectedPaisId = 1;
    component.selectedNivel1Id = 10;
    component.selectedNivel2Id = 20;
    component.territoriosNivel1 = [NIVEL1];
    component.territoriosNivel2 = [NIVEL2];
    component.abrirModalTerritorio(3);
    expect(document.querySelector('#territorioModalLabel').textContent).toContain('Parroquia');
    expect(document.querySelector('#territorioParentId').value).toBe('20');
  });

  it('abrirModalTerritorio modo edicion', async () => {
    setupMocks();
    await component.onInit();
    component.selectedPaisId = 1;
    const terr = { id: 99, nombre: 'Editado', tipo: 'Provincia', activo: true };
    component.abrirModalTerritorio(1, terr);
    expect(document.querySelector('#territorioModalLabel').textContent).toContain('Editar');
    expect(document.querySelector('#territorioId').value).toBe('99');
    expect(document.querySelector('#territorioNombre').value).toBe('Editado');
  });

  it('guardarTerritorio modo creacion', async () => {
    setupMocks();
    await component.onInit();
    const form = document.querySelector('#territorioForm');
    form.checkValidity = jest.fn(() => true);
    document.querySelector('#territorioId').value = '';
    document.querySelector('#territorioPaisId').value = '1';
    document.querySelector('#territorioNombre').value = 'Nuevo';
    document.querySelector('#territorioTipo').value = 'Provincia';
    document.querySelector('#territorioActivo').checked = true;
    document.querySelector('#territorioParentId').value = '';
    await component.guardarTerritorio({ preventDefault: jest.fn() });
    expect(UbicacionesService.createTerritorio).toHaveBeenCalled();
    expect(ToastService.success).toHaveBeenCalledWith('Territorio creado con éxito.');
  });

  it('guardarTerritorio modo actualizacion', async () => {
    setupMocks();
    await component.onInit();
    const form = document.querySelector('#territorioForm');
    form.checkValidity = jest.fn(() => true);
    document.querySelector('#territorioId').value = '50';
    document.querySelector('#territorioPaisId').value = '1';
    document.querySelector('#territorioNombre').value = 'Actualizado';
    document.querySelector('#territorioTipo').value = 'Provincia';
    document.querySelector('#territorioActivo').checked = true;
    document.querySelector('#territorioParentId').value = '';
    await component.guardarTerritorio({ preventDefault: jest.fn() });
    expect(UbicacionesService.updateTerritorio).toHaveBeenCalledWith('50', expect.any(Object));
    expect(ToastService.success).toHaveBeenCalledWith('Territorio actualizado con éxito.');
  });

  it('guardarTerritorio no guarda si formulario es invalido', async () => {
    setupMocks();
    await component.onInit();
    const form = document.querySelector('#territorioForm');
    form.checkValidity = jest.fn(() => false);
    await component.guardarTerritorio({ preventDefault: jest.fn() });
    expect(UbicacionesService.createTerritorio).not.toHaveBeenCalled();
  });

  it('guardarTerritorio maneja error', async () => {
    setupMocks();
    UbicacionesService.createTerritorio.mockRejectedValue(new Error('Error DB'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await component.onInit();
    const form = document.querySelector('#territorioForm');
    form.checkValidity = jest.fn(() => true);
    document.querySelector('#territorioId').value = '';
    document.querySelector('#territorioPaisId').value = '1';
    document.querySelector('#territorioNombre').value = 'Nuevo';
    document.querySelector('#territorioTipo').value = 'Provincia';
    document.querySelector('#territorioActivo').checked = true;
    document.querySelector('#territorioParentId').value = '';
    await component.guardarTerritorio({ preventDefault: jest.fn() });
    expect(console.error).toHaveBeenCalled();
    expect(document.querySelector('#territorioModalErrorAlert').classList.contains('d-none')).toBe(false);
    errSpy.mockRestore();
  });

  it('eliminarTerritorio nivel 1', async () => {
    setupMocks();
    await component.onInit();
    await component.eliminarTerritorio(10, 'Test', 1);
    expect(ModalService.confirm).toHaveBeenCalled();
    expect(UbicacionesService.deleteTerritorio).toHaveBeenCalledWith(10);
    expect(ToastService.success).toHaveBeenCalled();
  });

  it('eliminarTerritorio nivel 2', async () => {
    setupMocks();
    await component.onInit();
    await component.eliminarTerritorio(20, 'Test', 2);
    expect(UbicacionesService.deleteTerritorio).toHaveBeenCalledWith(20);
  });

  it('eliminarTerritorio nivel 3', async () => {
    setupMocks();
    await component.onInit();
    await component.eliminarTerritorio(30, 'Test', 3);
    expect(UbicacionesService.deleteTerritorio).toHaveBeenCalledWith(30);
  });

  it('eliminarTerritorio cancelado', async () => {
    setupMocks();
    ModalService.confirm.mockResolvedValue(false);
    await component.onInit();
    await component.eliminarTerritorio(10, 'Test', 1);
    expect(UbicacionesService.deleteTerritorio).not.toHaveBeenCalled();
  });

  it('eliminarTerritorio maneja error', async () => {
    setupMocks();
    UbicacionesService.deleteTerritorio.mockRejectedValue(new Error('Error'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await component.onInit();
    await component.eliminarTerritorio(10, 'Test', 1);
    expect(ToastService.error).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('actualizarEtiquetasColumnas con pais EC', async () => {
    setupMocks();
    await component.onInit();
    component.paisesList = [EC_PAIS];
    component.actualizarEtiquetasColumnas(1);
    expect(component.querySelector('#lblNivel1').textContent).toBe('Provincia');
    expect(component.querySelector('#lblNivel2').textContent).toBe('Cantón');
    expect(component.querySelector('#lblNivel3').textContent).toBe('Parroquia');
  });

  it('actualizarEtiquetasColumnas actualiza estados vacios', async () => {
    setupMocks();
    await component.onInit();
    component.paisesList = [EC_PAIS];
    component.actualizarEtiquetasColumnas(1);
    expect(component.querySelector('#listNivel2').innerHTML).toContain('Selecciona un(a) Provincia');
  });

  it('disconnectedCallback remueve modal del body', async () => {
    setupMocks();
    await component.onInit();
    document.body.removeChild(component);
    expect(document.querySelector('#territorioModal')).toBeNull();
  });

  it('deberia auto-seleccionar pais unico al llenar select', async () => {
    setupMocks([EC_PAIS]);
    await component.onInit();
    expect(component.selectedPaisId).toEqual(1);
  });

  it('deberia manejar error en cargarPaises', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    setupMocks();
    UbicacionesService.getPaises.mockRejectedValue(new Error('Error'));
    await component.onInit();
    expect(console.error).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('deberia manejar error al inicializar modal de territorios', async () => {
    setupMocks();
    window.bootstrap.Modal = jest.fn(() => { throw new Error('Modal error'); });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await component.onInit();
    expect(console.warn).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('deberia actualizar estado al cambiar pais en explorerPaisSelect', async () => {
    setupMocks([EC_PAIS], () => Promise.resolve([NIVEL1]));
    await component.onInit();
    const spyLabels = jest.spyOn(component, 'actualizarEtiquetasColumnas');
    const spyCol1 = jest.spyOn(component, 'cargarTerritoriosColumna1');
    const select = component.querySelector('#explorerPaisSelect');
    select.value = '1';
    select.dispatchEvent(new Event('change'));
    expect(component.selectedPaisId).toBe('1');
    expect(component.selectedNivel1Id).toBeNull();
    expect(component.selectedNivel2Id).toBeNull();
    expect(spyLabels).toHaveBeenCalledWith('1');
    expect(spyCol1).toHaveBeenCalled();
  });

  it('deberia abrir modal edicion al hacer click en editar de columna 1', async () => {
    setupMocks([EC_PAIS], () => Promise.resolve([NIVEL1]));
    await component.onInit();
    component.selectedPaisId = 1;
    component.territoriosNivel1 = [NIVEL1];
    component.renderColumna1();
    component.querySelector('#listNivel1 .btn-edit-t').click();
    expect(document.querySelector('#territorioModalLabel').textContent).toContain('Editar');
    expect(document.querySelector('#territorioId').value).toBe('10');
  });

  it('deberia eliminar al hacer click en eliminar de columna 1', async () => {
    setupMocks([EC_PAIS], () => Promise.resolve([NIVEL1]));
    await component.onInit();
    component.selectedPaisId = 1;
    component.territoriosNivel1 = [NIVEL1];
    const spyEliminar = jest.spyOn(component, 'eliminarTerritorio');
    component.renderColumna1();
    const btn = component.querySelector('#listNivel1 .btn-delete-t');
    btn.click();
    expect(spyEliminar).toHaveBeenCalledWith(10, 'Pichincha', 1);
  });

  it('deberia seleccionar item en columna 2 y cargar columna 3', async () => {
    setupMocks([EC_PAIS], (page, perPage, cursor, params) => {
      if (params.parent_id === 10) return Promise.resolve([NIVEL2]);
      if (params.parent_id === 20) return Promise.resolve([NIVEL3]);
      return Promise.resolve([]);
    });
    await component.onInit();
    component.selectedPaisId = 1;
    component.selectedNivel1Id = 10;
    component.territoriosNivel2 = [NIVEL2];
    component.renderColumna2();
    component.querySelector('#listNivel2 .list-group-item').click();
    expect(component.selectedNivel2Id).toBe(20);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(component.territoriosNivel3).toEqual([NIVEL3]);
  });

  it('deberia abrir modal edicion al hacer click en editar de columna 2', async () => {
    setupMocks([EC_PAIS], () => Promise.resolve([NIVEL2]));
    await component.onInit();
    component.selectedPaisId = 1;
    component.selectedNivel1Id = 10;
    component.territoriosNivel2 = [NIVEL2];
    component.renderColumna2();
    component.querySelector('#listNivel2 .btn-edit-t').click();
    expect(document.querySelector('#territorioModalLabel').textContent).toContain('Editar');
  });

  it('deberia eliminar al hacer click en eliminar de columna 2', async () => {
    setupMocks([EC_PAIS], () => Promise.resolve([NIVEL2]));
    await component.onInit();
    component.selectedPaisId = 1;
    component.selectedNivel1Id = 10;
    component.territoriosNivel2 = [NIVEL2];
    const spyEliminar = jest.spyOn(component, 'eliminarTerritorio');
    component.renderColumna2();
    component.querySelector('#listNivel2 .btn-delete-t').click();
    expect(spyEliminar).toHaveBeenCalledWith(20, 'Quito', 2);
  });

  it('deberia abrir modal edicion al hacer click en editar de columna 3', async () => {
    setupMocks([EC_PAIS], () => Promise.resolve([NIVEL3]));
    await component.onInit();
    component.selectedPaisId = 1;
    component.selectedNivel1Id = 10;
    component.selectedNivel2Id = 20;
    component.territoriosNivel3 = [NIVEL3];
    component.renderColumna3();
    component.querySelector('#listNivel3 .btn-edit-t').click();
    expect(document.querySelector('#territorioModalLabel').textContent).toContain('Editar');
  });

  it('deberia eliminar al hacer click en eliminar de columna 3', async () => {
    setupMocks([EC_PAIS], () => Promise.resolve([NIVEL3]));
    await component.onInit();
    component.selectedPaisId = 1;
    component.selectedNivel1Id = 10;
    component.selectedNivel2Id = 20;
    component.territoriosNivel3 = [NIVEL3];
    const spyEliminar = jest.spyOn(component, 'eliminarTerritorio');
    component.renderColumna3();
    component.querySelector('#listNivel3 .btn-delete-t').click();
    expect(spyEliminar).toHaveBeenCalledWith(30, 'Iñaquito', 3);
  });

  it('abrirModalTerritorio actualiza label nombre y feedback', async () => {
    setupMocks();
    await component.onInit();
    component.selectedPaisId = 1;
    component.abrirModalTerritorio(1);
    const lbl = document.querySelector('label[for="territorioNombre"]');
    const feedback = document.querySelector('#territorioNombre ~ .invalid-feedback');
    expect(lbl.textContent).toContain('Provincia');
    expect(feedback.textContent).toContain('Provincia');
  });

  it('guardarTerritorio recarga columna 2 cuando parentId coincide con selectedNivel1Id', async () => {
    setupMocks();
    await component.onInit();
    const form = document.querySelector('#territorioForm');
    form.checkValidity = jest.fn(() => true);
    document.querySelector('#territorioId').value = '';
    document.querySelector('#territorioPaisId').value = '1';
    document.querySelector('#territorioNombre').value = 'Nuevo';
    document.querySelector('#territorioTipo').value = 'Cantón';
    document.querySelector('#territorioActivo').checked = true;
    document.querySelector('#territorioParentId').value = '10';
    component.selectedNivel1Id = 10;
    component.selectedNivel2Id = null;
    const spy = jest.spyOn(component, 'cargarTerritoriosColumna2');
    await component.guardarTerritorio({ preventDefault: jest.fn() });
    expect(spy).toHaveBeenCalled();
  });

  it('guardarTerritorio recarga columna 3 cuando parentId coincide con selectedNivel2Id', async () => {
    setupMocks();
    await component.onInit();
    const form = document.querySelector('#territorioForm');
    form.checkValidity = jest.fn(() => true);
    document.querySelector('#territorioId').value = '';
    document.querySelector('#territorioPaisId').value = '1';
    document.querySelector('#territorioNombre').value = 'Nuevo';
    document.querySelector('#territorioTipo').value = 'Parroquia';
    document.querySelector('#territorioActivo').checked = true;
    document.querySelector('#territorioParentId').value = '20';
    component.selectedNivel1Id = 10;
    component.selectedNivel2Id = 20;
    const spy = jest.spyOn(component, 'cargarTerritoriosColumna3');
    await component.guardarTerritorio({ preventDefault: jest.fn() });
    expect(spy).toHaveBeenCalled();
  });
});
