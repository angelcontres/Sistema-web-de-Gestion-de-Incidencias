### 1. Instalar el driver de S3 para Laravel

Por defecto, Laravel no incluye el SDK de AWS S3 en su instalación limpia. Deben abrir la terminal en la carpeta `backend/api` e instalar la librería oficial de Flysystem para S3:

```bash
composer require league/flysystem-aws-s3-v3
```

_(Este comando modificará el archivo `composer.json` y descargará la librería necesaria para que Laravel reconozca el driver `s3`)._

### 2. Configurar el archivo `.env`

En el archivo `.env` del servidor de producción (o de sus entornos locales si quieren probarlo), deben reemplazar las variables de almacenamiento con sus datos de AWS:

```env
# 1. Cambiar el disco por defecto a S3
FILESYSTEM_DISK=s3

# 2. Configurar las credenciales del bucket
AWS_ACCESS_KEY_ID=tu_access_key_aqui
AWS_SECRET_ACCESS_KEY=tu_secret_key_aqui
AWS_DEFAULT_REGION=us-east-1             # Tu región de AWS
AWS_BUCKET=nombre-de-tu-bucket
AWS_URL=https://nombre-de-tu-bucket.s3.amazonaws.com
```

### ¿Cómo funcionará tras esto?

- **Al guardar:** En `IncidenciaController.php`, la instrucción `Storage::disk($disk)->put(...)` detectará que `$disk` es `s3` y subirá la imagen automáticamente al bucket de AWS en lugar de guardarla en el disco duro local.
- **Al mostrar:** En el modelo `RecursoIncidencia.php`, la función `getUrlAttribute()` ejecutará `Storage::disk('s3')->url($value)`. Esto generará automáticamente la URL pública directa de AWS (ej. `https://nombre-de-tu-bucket.s3.amazonaws.com/incidencias/foto.webp`) para que el frontend la renderice directamente sin pasar por tu servidor.

> [!IMPORTANT]
> Deben asegurarse de que el bucket de S3 tenga **permisos de lectura públicos** (o una política de bucket que permita la lectura de objetos) para que el navegador de los usuarios pueda cargar las imágenes usando las URLs generadas.
