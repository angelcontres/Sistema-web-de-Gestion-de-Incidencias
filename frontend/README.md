# Frontend - Sistema de Gestión de Incidencias

Este es el frontend del proyecto estructurado como una **Single Page Application (SPA)** moderna y modular, utilizando **Web Components Nativos** y un patrón inspirado en **Angular** (`templateUrl` y separación completa de archivos HTML y JS).

Todo esto se logra **sin dependencias externas pesadas de Node.js, compiladores ni empaquetadores**.

---

##  Estructura de Directorios

El código está estructurado de manera modular por características (*features* / páginas) y componentes globales reutilizables:

```text
frontend/
├── index.html            # Punto de entrada único y contenedor de la aplicación.
├── jsconfig.json         # Configuración de validación estática de JS en VS Code.
├── README.md             # Esta documentación.
├── css/
│   └── style.css         # Estilos globales y tokens del sistema de diseño (premium).
└── js/
    ├── app.js            # Punto de inicio (importa componentes y arranca el enrutador).
    ├── router.js         # Enrutador cliente basado en Hash (`#/`, `#/datos`).
    ├── core/
    │   └── base-component.js # Componente base del que heredan todos los demás.
    ├── components/       # Componentes pequeños y reutilizables.
    │   ├── stats-card.js
    │   └── navbar/
    │       ├── navbar.component.js
    │       └── navbar.component.html
    └── pages/            # Vistas principales de la aplicación (Features).
        ├── dashboard/
        │   ├── dashboard.component.js
        │   └── dashboard.component.html
        ├── datos/
        │   ├── datos.component.js
        │   └── datos.component.html
        └── registro/
            ├── registro.component.js
            └── registro.component.html
```

---

## Reglas de Formateo y Validación (Linting) Integradas

No es necesario ejecutar `npm install` ni configurar herramientas pesadas. El editor (VS Code o Cursor) utiliza reglas nativas a través de:

1. **Autoformateo al Guardar (`.vscode/settings.json` en la raíz):**
   * Formatea automáticamente HTML, CSS y JavaScript al presionar guardar (`Ctrl + S`).
   * Configura tabulación estándar a **2 espacios**.
   * Fuerza el uso automático de **comillas simples (`'`)** y coloca **puntos y comas (`;`)** al final de las declaraciones.

2. **Linter Estático Nivel TypeScript (`frontend/jsconfig.json`):**
   * Al tener `"checkJs": true`, VS Code valida tu código JavaScript simulando TypeScript. Te mostrará líneas rojas si tienes:
     * Typos o nombres de variables mal escritos.
     * Imports o rutas de archivos rotas.
     * Número incorrecto de argumentos en funciones.

---

## ¿Cómo funciona la arquitectura bajo el capó?

### 1. El Enrutador de URL (Hash Routing)
Cuando navegas haciendo clic en un enlace como `<a href="#/datos">`:
1. El navegador cambia la URL (`/#/datos`), pero **no** solicita una nueva página al servidor.
2. El archivo `router.js` escucha el evento `hashchange`.
3. Busca en su listado si existe la ruta. Si existe, reemplaza el interior de `<main id="app">` con la etiqueta personalizada correspondiente:
   ```javascript
   document.getElementById('app').innerHTML = '<app-datos></app-datos>';
   ```

### 2. El Componente Base (`BaseComponent`)
Todos tus componentes extienden de `BaseComponent` (ubicado en `js/core/base-component.js`). Su ciclo de vida es el siguiente:
1. El navegador detecta que el elemento (por ejemplo `<app-datos>`) se inserta en el DOM y ejecuta el método nativo `connectedCallback()`.
2. `BaseComponent` descarga de forma asíncrona la plantilla HTML (`fetch(templateUrl)`).
3. Inserta el HTML directamente en la página (`this.innerHTML = htmlText`).
4. Dispara la función `onInit()`. **Aquí es donde debes escribir toda tu lógica, escuchar clicks y buscar elementos**, ya que el HTML está garantizado que ya existe en el DOM.

---

## Guía de Desarrollo: Cómo crear una nueva página / feature

Si deseas añadir una nueva vista (por ejemplo, "Perfil de Usuario" en la ruta `#/perfil`), sigue estos **4 pasos**:

### Paso 1: Crea la carpeta y los archivos
Dentro de `js/pages/`, crea una carpeta llamada `perfil/` y dentro de ella crea dos archivos:
1. `perfil.component.html` (el HTML de tu nueva página).
2. `perfil.component.js` (la lógica JS).

### Paso 2: Escribe la lógica del componente
En tu archivo `perfil.component.js`, hereda de `BaseComponent` y define su etiqueta HTML personalizada en la parte inferior:

```javascript
import { BaseComponent } from '../../core/base-component.js';

export class PerfilComponent extends BaseComponent {
  constructor() {
    // 1. Apuntas a la plantilla HTML de esta página
    super('js/pages/perfil/perfil.component.html');
  }

  /**
   * Ciclo de vida: Equivalente a ngOnInit() de Angular.
   * Se ejecuta automáticamente cuando el HTML de arriba ya se cargó en pantalla.
   */
  onInit() {
    console.log('Página de perfil cargada.');
    
    // Aquí puedes buscar elementos del DOM con "this.querySelector"
    const botonGuardar = this.querySelector('#btnGuardar');
    if (botonGuardar) {
      botonGuardar.addEventListener('click', () => alert('Guardado!'));
    }
  }
}

// 2. Registras el componente ante el navegador
customElements.define('app-perfil', PerfilComponent);
```

### Paso 3: Importa el componente en la aplicación
Abre el archivo **[app.js](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/frontend/js/app.js)** y añade el import de tu nuevo componente al final de la sección de páginas:

```javascript
// Import Pages (Features)
import './pages/dashboard/dashboard.component.js';
import './pages/datos/datos.component.js';
import './pages/registro/registro.component.js';
import './pages/perfil/perfil.component.js'; // <-- Tu nuevo import
```

### Paso 4: Añade la ruta al enrutador
Abre el archivo **[router.js](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/frontend/js/router.js)** y asocia el hash de tu URL con la etiqueta personalizada que definiste en el paso 2:

```javascript
const routes = {
  '#/': 'app-dashboard',
  '#/datos': 'app-datos',
  '#/registro': 'app-registro',
  '#/perfil': 'app-perfil' // <-- Tu nueva ruta
};
```

¡Listo! Si ahora colocas un enlace como `<a href="#/perfil">Ir al Perfil</a>` en cualquier parte, se cargará la vista instantáneamente sin parpadeos.

---

## Cómo levantar el servidor de desarrollo local

Los navegadores bloquean la carga de módulos JS locales (`import`/`export`) desde archivos directos en disco (`file:///...`) por seguridad. Debes servir la aplicación mediante un servidor web básico:

**Con Python (cualquier versión):**
Abra una terminal en la carpeta del frontend y ejecute:
```bash
cd frontend
python -m http.server 3000
```
Luego entra en tu navegador a: [http://localhost:3000](http://localhost:3000).

**Con VS Code:**
Si tienes instalada la extensión **Live Server**, abre la carpeta `frontend/` y haz clic en el botón **"Go Live"** en la barra inferior.
