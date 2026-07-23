# Backend

Este directorio contiene el backend del proyecto. La aplicación principal está
en `api/`, donde quedó generado un proyecto Laravel listo para trabajar como API
REST.

## Estructura

- `api/` - Proyecto Laravel principal del backend.

## Requisitos

- PHP 8.2 o superior
- Composer
- Extensión de base de datos para PHP:
	- PostgreSQL: `php-pgsql`
- Servidor de base de datos local o remoto

## Instalación

```bash
cd backend/api
composer install
cp .env.example .env
php artisan key:generate
```

## Configurar base de datos

Puedes usar PostgreSQL o MySQL. Solo cambia el archivo `.env`.

### PostgreSQL

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=incidencias
DB_USERNAME=postgres
DB_PASSWORD=tu_password
```

### MySQL

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=incidencias
DB_USERNAME=root
DB_PASSWORD=tu_password
```

## Ejecutar el backend

```bash
cd backend/api
php artisan migrate
php artisan serve
```

Por defecto la API queda disponible en:

```bash
http://127.0.0.1:8000
```

## Rutas importantes

- `routes/api.php` - Endpoints de la API.
- `database/migrations/` - Tablas y cambios de esquema.
- `app/Models/` - Modelos de dominio.
- `app/Http/Controllers/` - Controladores.

## Sistema de Control de Accesos Basado en Roles (RBAC)

Este backend implementa un sistema RBAC estricto donde los accesos se evalúan a nivel de **Permisos** específicos asociados a **Roles**, sin lógica "hardcodeada" en base a nombres de roles (como `Admin` o `Supervisor`).

### Estructura de la Base de Datos
La seguridad se rige por las siguientes tablas en la base de datos:
1. **`roles`**: Almacena los perfiles de usuario (ej: `Admin`, `Ciudadano`, `Institucion`).
2. **`permisos`**: Contiene las acciones habilitadas sobre recursos específicos.
   - `nombre`: Nombre legible del permiso (ej: `Ver Usuario`, `Crear Incidencia`).
   - `accion`: Verbo REST/CRUD (ej: `READ`, `CREATE`, `UPDATE`, `DELETE`).
   - `recurso`: Identificador del recurso o módulo sobre el que opera (ej: `usuarios`, `incidencias`).
   - `opcion_menu_id` (nullable): Permite asociar opcionalmente un permiso a una opción del menú de navegación.
3. **`roles_permisos`**: Tabla pivote que vincula los permisos habilitados para cada rol.

### Cómo funciona la verificación
Toda verificación de accesos pasa por dos mecanismos de seguridad en Laravel:

#### 1. Middleware de Recursos Automático (`CheckResourcePermission`)
Este middleware se aplica a nivel global o grupal en las rutas de la API de recursos RESTful.
- **Funcionamiento**: Lee automáticamente la ruta de la petición (ej. `/api/v1/incidencias`) para extraer el recurso (`incidencias`) y el método HTTP para inferir la acción (`GET` -> `READ`, `POST` -> `CREATE`, `PUT/PATCH` -> `UPDATE`, `DELETE` -> `DELETE`).
- **Verificación**: Comprueba si el usuario autenticado posee un rol con el permiso que coincida exactamente con la combinación de la `accion` y `recurso` en la tabla pivote de la base de datos.
- **Ventaja**: No requiere configuración de código por cada nueva ruta de recursos agregada al backend.

#### 2. Middleware Explícito (`CheckPermission`)
Se utiliza para rutas especiales o endpoints personalizados que no siguen la estructura estándar de recursos.
- **Uso**: Se define en el archivo de rutas `routes/api.php` mediante el alias del middleware pasando el nombre del permiso deseado.
- **Ejemplo**:
  ```php
  Route::get('/reportes/avanzados', [ReportController::class, 'index'])->middleware('permission:Ver Reportes');
  ```
- **Resolución dinámica**: El middleware buscará la existencia del permiso por string. Si el string está en la clase `PermissionsEnum.php`, resolverá por validación tipada. En caso contrario, realizará una búsqueda directa por string en la base de datos (`$user->hasPermission('Ver Reportes')`), lo que permite que sea 100% dinámico y no requiera actualizar el código PHP para nuevos permisos introducidos.

### Flujo de Autenticación de Permisos en el Login (`/api/v1/me`)
Cuando el usuario inicia sesión o solicita su información de sesión:
1. El backend recopila todos los permisos únicos asociados a los roles del usuario.
2. Envía en el payload dos tipos de representación por cada permiso:
   - El nombre literal: `Ver Usuario` (para compatibilidad).
   - El código dinámico estandarizado: `READ_USUARIOS` (generado a partir de la fórmula `${accion}_${recurso}`).
3. El frontend consume la lista estandarizada para hacer validaciones dinámicas instantáneas mediante `AuthService.hasPermission('READ', 'usuarios')` sin requerir archivos `Enum` locales.
