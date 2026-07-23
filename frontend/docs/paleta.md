# Paleta de Colores de Bootstrap

Esta guía detalla las clases utilitarias de Bootstrap para aplicar colores al texto y a los fondos de los elementos. Estas clases permiten mantener una coherencia visual en todo el proyecto.

## Colores de Texto

Las clases de color de texto permiten cambiar el color de la fuente utilizando los colores del tema de Bootstrap.

| Clase | Descripción | Código HTML de Ejemplo |
|---|---|---|
| `.text-primary` | Color principal (azul) | `<p class="text-primary">.text-primary</p>` |
| `.text-secondary` | Color secundario (gris) | `<p class="text-secondary">.text-secondary</p>` |
| `.text-success` | Éxito (verde) | `<p class="text-success">.text-success</p>` |
| `.text-danger` | Peligro/Error (rojo) | `<p class="text-danger">.text-danger</p>` |
| `.text-warning` | Advertencia (amarillo) | `<p class="text-warning">.text-warning</p>` |
| `.text-info` | Información (cian) | `<p class="text-info">.text-info</p>` |
| `.text-light` | Claro (gris claro) | `<p class="text-light bg-dark">.text-light</p>` |
| `.text-dark` | Oscuro (casi negro) | `<p class="text-dark">.text-dark</p>` |
| `.text-body` | Color de texto por defecto del body | `<p class="text-body">.text-body</p>` |
| `.text-muted` | Texto atenuado (gris suave) | `<p class="text-muted">.text-muted</p>` |
| `.text-white` | Blanco puro | `<p class="text-white bg-dark">.text-white</p>` |
| `.text-black-50` | Negro con 50% de opacidad | `<p class="text-black-50">.text-black-50</p>` |
| `.text-white-50` | Blanco con 50% de opacidad | `<p class="text-white-50 bg-dark">.text-white-50</p>` |

## Colores de Fondo

Las clases de color de fondo permiten definir el color de relleno (background) de cualquier elemento.

| Clase | Descripción | Código HTML de Ejemplo |
|---|---|---|
| `.bg-primary` | Fondo principal (azul) | `<div class="p-3 mb-2 bg-primary text-white">.bg-primary</div>` |
| `.bg-secondary` | Fondo secundario (gris) | `<div class="p-3 mb-2 bg-secondary text-white">.bg-secondary</div>` |
| `.bg-success` | Fondo de éxito (verde) | `<div class="p-3 mb-2 bg-success text-white">.bg-success</div>` |
| `.bg-danger` | Fondo de peligro (rojo) | `<div class="p-3 mb-2 bg-danger text-white">.bg-danger</div>` |
| `.bg-warning` | Fondo de advertencia (amarillo) | `<div class="p-3 mb-2 bg-warning text-dark">.bg-warning</div>` |
| `.bg-info` | Fondo de información (cian) | `<div class="p-3 mb-2 bg-info text-white">.bg-info</div>` |
| `.bg-light` | Fondo claro | `<div class="p-3 mb-2 bg-light text-dark">.bg-light</div>` |
| `.bg-dark` | Fondo oscuro | `<div class="p-3 mb-2 bg-dark text-white">.bg-dark</div>` |
| `.bg-white` | Fondo blanco | `<div class="p-3 mb-2 bg-white text-dark">.bg-white</div>` |
| `.bg-transparent`| Fondo transparente | `<div class="p-3 mb-2 bg-transparent text-dark">.bg-transparent</div>` |

---
**Nota:** Al utilizar colores de fondo claros (`bg-light`, `bg-warning`, `bg-white`), es recomendable usar texto oscuro (`text-dark`) para asegurar el contraste adecuado y mejorar la legibilidad. De igual manera, con fondos oscuros, se debe utilizar texto claro o blanco.
