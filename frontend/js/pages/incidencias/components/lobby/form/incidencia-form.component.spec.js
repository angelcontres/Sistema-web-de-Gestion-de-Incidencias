import { IncidenciaFormComponent } from './incidencia-form.component.js';
import { AuthService } from '../../../../../core/auth.service.js';

describe('IncidenciaFormComponent - Vista de Ciudadano', () => {
  let component;

  beforeEach(async () => {
    // 1. Simular sesión del usuario con rol Ciudadano
    AuthService.getCurrentUser = () => ({
      name: 'Ciudadano Ejemplo',
      email: 'ciudadano@example.com',
      roles: [{ nombre: 'Ciudadano' }],
    });

    // Mockear la respuesta de la plantilla HTML
    const mockHtml = `
      <form id="incidenciaForm" class="needs-validation" novalidate>
        <div id="sectionAsignacion"></div>
        <div id="detallesDireccionContainer" class="col-lg-5">
          <input type="text" id="dirDetalle" required />
          <select id="dirPais" required></select>
          <select id="dirNivel1" required></select>
          <select id="dirNivel2" required></select>
          <select id="dirNivel3" required></select>
        </div>
        <div id="colMapaContainer" class="col-lg-7">
          <div id="incidenciaMapa"></div>
          <div id="infoUbicacionMinimalista" class="d-none">
            <span id="txtInfoUbicacion"></span>
          </div>
        </div>
        <input type="hidden" id="incidenciaId" />
        <input type="hidden" id="incidenciaVersion" />
        <select id="tipoSelect"></select>
        <select id="subTipoSelect"></select>
        <input type="number" id="cantidadAfectados" />
        <div id="prioridadDisplay"></div>
        <textarea id="descripcion"></textarea>
        <select id="institucionSelect"></select>
        <select id="estadoSelect"></select>
        <input type="hidden" id="dirLat" />
        <input type="hidden" id="dirLng" />
        <button type="button" id="btnBuscarDireccion"></button>
        <input type="text" id="direccionSearch" />
        <button type="submit" id="btnSubmit"></button>
        <button type="button" id="btnConfirmarResolucion"></button>
        <div id="divInstitucion"></div>
        <h1 id="formTitle"></h1>
        <span id="btnText"></span>
      </form>
    `;

    // Mock de fetch para retornar la plantilla simulada
    window.fetch = () =>
      Promise.resolve({
        text: () => Promise.resolve(mockHtml),
      });

    // Instanciar el componente
    component = new IncidenciaFormComponent();
    document.body.appendChild(component);

    // Mockear métodos del ciclo de vida externos para evitar errores de librerías (Leaflet, APIs)
    component.initMap = () => {};
    component.cargarCatalogosIniciales = () => Promise.resolve();

    // Ejecutar la inicialización
    await component.onInit();
  });

  afterEach(() => {
    document.body.removeChild(component);
  });

  test('debe ocultar el contenedor de detalle de ubicación para Ciudadano', () => {
    const detContainer = component.querySelector('#detallesDireccionContainer');
    expect(detContainer.classList.contains('d-none')).toBe(true);
  });

  test('el mapa debe expandirse ocupando todo el ancho (col-lg-12) para Ciudadano', () => {
    const colMapa = component.querySelector('#colMapaContainer');
    expect(colMapa.classList.contains('col-lg-12')).toBe(true);
    expect(colMapa.classList.contains('col-lg-7')).toBe(false);
  });

  test('debe mostrar el indicativo minimalista de ubicación debajo del mapa', () => {
    const infoMinimalista = component.querySelector('#infoUbicacionMinimalista');
    expect(infoMinimalista.classList.contains('d-none')).toBe(false);
  });

  test('debe remover el atributo required de los campos ocultos para pasar validación nativa', () => {
    const dirDetalle = component.querySelector('#dirDetalle');
    const dirPais = component.querySelector('#dirPais');
    expect(dirDetalle.hasAttribute('required')).toBe(false);
    expect(dirPais.hasAttribute('required')).toBe(false);
  });
});
