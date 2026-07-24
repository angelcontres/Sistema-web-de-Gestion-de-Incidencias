<?php
/**
 * normalize_clover.php
 * 
 * Este script convierte las rutas absolutas (de Windows o de Docker /var/www/html/)
 * en los archivos clover.xml y junit.xml a rutas relativas al proyecto (ej. backend/api/app/...)
 * para que SonarQube pueda mapear correctamente las métricas.
 */

$files = [
    __DIR__ . '/build/logs/clover.xml',
    __DIR__ . '/build/logs/junit.xml'
];

// Ruta base del proyecto para desarrollo local (Windows)
$projectRoot = dirname(__DIR__, 2); 
$projectRoot = str_replace('\\', '/', $projectRoot);

foreach ($files as $file) {
    if (!file_exists($file)) {
        echo "Aviso: No se encontró el archivo $file (saltando...)\n";
        continue;
    }

    echo "Procesando $file...\n";
    $content = file_get_contents($file);

    if ($content === false) {
        echo "Error al leer el archivo $file\n";
        continue;
    }

    // 1. Reemplazar rutas absolutas de Windows por relativas
    if (!empty($projectRoot)) {
        $rootWithSlash = $projectRoot . '/';
        $rootWithBackslash = str_replace('/', '\\', $projectRoot) . '\\';
        
        $content = str_replace($rootWithSlash, '', $content);
        $content = str_replace($rootWithBackslash, '', $content);
    }

    // 2. Reemplazar rutas absolutas de Docker en producción (/var/www/html/ -> backend/api/)
    $content = str_replace('/var/www/html/', 'backend/api/', $content);

    // Guardar cambios
    if (file_put_contents($file, $content) !== false) {
        echo "¡Éxito! Rutas normalizadas en $file.\n";
    } else {
        echo "Error: No se pudo escribir en el archivo $file.\n";
    }
}
