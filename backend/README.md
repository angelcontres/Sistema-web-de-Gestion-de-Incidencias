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
