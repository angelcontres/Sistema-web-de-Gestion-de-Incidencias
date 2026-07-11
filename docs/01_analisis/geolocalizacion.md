# Unidad 4 - Tarea 4: Geolocalización

---

# ¿Qué es la Geolocalización?

- La geolocalización permite obtener la ubicación aproximada o exacta de un dispositivo mediante el GPS, redes Wi-Fi o antenas de telefonía móvil.

- En aplicaciones web, esta funcionalidad se obtiene mediante la **Geolocation API** de HTML5 y JavaScript, siempre con la autorización del usuario.

| Dato          | Descripción                                               |
| ------------- | --------------------------------------------------------- |
| **Latitud**   | Posición Norte o Sur respecto al Ecuador.                 |
| **Longitud**  | Posición Este u Oeste respecto al meridiano de Greenwich. |
| **Precisión** | Margen de error de la ubicación en metros.                |

## Margen de error

- La precisión es una estimación y depende de cómo el dispositivo obtuvo la ubicación.

- Algunos factores que influyen son:
  - Cantidad de satélites visibles.
  - Edificios altos.
  - Espacios cerrados.
  - Condiciones atmosféricas.
  - Calidad del receptor GPS.

## ¿Cómo lo sabe JavaScript?

La **Geolocation API** devuelve una propiedad llamada **accuracy**, que indica el radio estimado de error en metros.

| Fuente de ubicación | ¿Por qué ocurre?                                                                                                          | Precisión aproximada          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **GPS**             | El dispositivo calcula la posición usando señales de varios satélites. Método más preciso.                                | **3 a 10 metros**             |
| **Wi-Fi**           | La ubicación se estima comparando las redes Wi-Fi cercanas con una base de datos conocida.                                | **10 a 50 metros**            |
| **Red celular**     | Solo se conoce la antena de telefonía a la que está conectado el dispositivo, por lo que el área estimada es mucho mayor. | **100 a 1000 metros (o más)** |

---

# A menor _accuracy_, mayor precisión

| Accuracy (m) | Precisión | Interpretación                                                         |
| ------------ | --------- | ---------------------------------------------------------------------- |
| **3 m**      | Excelente | La ubicación real está aproximadamente dentro de un radio de 3 metros. |
| **8 m**      | Muy buena | Ideal para aplicaciones de geolocalización.                            |
| **20 m**     | Buena     | Adecuada para la mayoría de aplicaciones web.                          |
| **50 m**     | Aceptable | Puede variar dentro de una calle o un edificio.                        |
| **200 m**    | Baja      | Solo indica una zona aproximada.                                       |
| **1000 m**   | Muy baja  | Solo identifica un sector o barrio.                                    |

---

# Información que devuelve la Geolocation API

| Propiedad   | Descripción                                      |
| ----------- | ------------------------------------------------ |
| `latitude`  | Latitud                                          |
| `longitude` | Longitud                                         |
| `accuracy`  | Precisión (metros)                               |
| `altitude`  | Altitud (si existe)                              |
| `speed`     | Velocidad del dispositivo (m/s)                  |
| `heading`   | Dirección de movimiento del dispositivo (grados) |

---

# Implementación de la geolocalización en Laravel

## Paso 1. Preparación de la base de datos

**Archivo:** Script SQL de creación de la base de datos (o migración).

### Acciones realizadas

Agregar los campos:

- `latitud_devolucion`
- `longitud_devolucion`
- `precision_gps`

---

## Paso 2. Actualización del modelo

**Archivo:** `app/Models/Prestamo.php`

### Acciones realizadas

- Incorporar los nuevos campos en `$fillable`.
- Configurar el tipo de datos en `$casts`.

Con esto, **Eloquent** puede leer y guardar automáticamente las coordenadas.

---

# Paso 3. Creación del controlador de pruebas

**Archivo creado:**

`app/Http/Controllers/GeolocalizacionController.php`

## Flujo del proceso

- **exists:** verifica que el dato enviado exista en la base de datos antes de procesarlo.

- **findOrFail():** recupera el registro; si no existe, Laravel detiene la ejecución y devuelve un error **404**.

- **withInput():** conserva los datos que el usuario había ingresado para que no tenga que escribirlos nuevamente.

- **withErrors():** envía mensajes de error a la vista para informar al usuario qué ocurrió.

---

# Paso 4. Registro de rutas

**Archivo:**

```text
routes/web.php
```

Registrar las rutas:

- `/geolocalizacion`
- `/geolocalizacion/guardar`

---

# Paso 5. Creación de la vista

**Archivo creado:**

```text
resources/views/geolocalizacion/index.blade.php
```

Construir una interfaz sencilla para:

Implementar JavaScript utilizando la **API HTML5 Geolocation** para:

- solicitar permiso al usuario;
- obtener las coordenadas;
- colocarlas en el formulario.

---

# JavaScript utilizando la API HTML5 Geolocation

## Paso 6. Integración con el módulo de préstamos

**Archivo**

```text
resources/views/prestamos/devolver.blade.php
```

### Acciones

_(La diapositiva no contiene más información en esta sección.)_

---

# Paso 7. Visualización de la ubicación y mapa

**Archivo creado:**

```text
resources/views/prestamos/show.blade.php
```

Mostrar la ubicación almacenada utilizando un mapa interactivo.

Integrar:

- **Leaflet.js**
- **OpenStreetMap**

Para:

- centrar el mapa en las coordenadas almacenadas;
- colocar un marcador sobre la ubicación de devolución.

---

# Paso 8. Acceso al mapa

**Archivo:**

```text
resources/views/prestamos/index.blade.php
```

Agregar los botones:

- **Ver mapa** (visualización dentro del sistema).
- **Google Maps** (visualización externa).
