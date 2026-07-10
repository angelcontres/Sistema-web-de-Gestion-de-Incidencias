<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

Route::get('/', function () {
    return view('welcome');
});

/**
 * Ruta para obtener la métrica Tasa de Éxito de Pruebas (TEP) y exponerla para Grafana
 */
Route::get('/api/v1/metrics/tep/{date?}', function ($date = null) {
    $directory = base_path("tests/metrics-stg/tep");

    if ($date === null) {
        if (!File::exists($directory)) {
            return response()->json([]);
        }
        
        $files = File::files($directory);
        $metrics = [];
        
        foreach ($files as $file) {
            if ($file->getExtension() === 'json' && str_starts_with($file->getFilename(), 'tep-')) {
                $content = json_decode(File::get($file->getRealPath()), true);
                if ($content) {
                    $metrics[] = $content;
                }
            }
        }
        
        // Ordenar de más antiguo a más reciente para gráficos de series temporales
        usort($metrics, function ($a, $b) {
            return strcmp($a['fecha_procesamiento'] ?? '', $b['fecha_procesamiento'] ?? '');
        });
        
        return response()->json($metrics);
    }

    $path = "{$directory}/tep-{$date}.json";

    if (!File::exists($path)) {
        return response()->json(['error' => 'Métrica no encontrada para la fecha: ' . $date], 404);
    }

    return response()->json(json_decode(File::get($path), true));
});

/**
 * Ruta para obtener la métrica Cobertura Funcional (CF) y exponerla para Grafana
 */
Route::get('/api/v1/metrics/cf/{date?}', function ($date = null) {
    $directory = base_path("tests/metrics-stg/cf");

    if ($date === null) {
        if (!File::exists($directory)) {
            return response()->json([]);
        }
        
        $files = File::files($directory);
        $metrics = [];
        
        foreach ($files as $file) {
            if ($file->getExtension() === 'json' && str_starts_with($file->getFilename(), 'cf-')) {
                $content = json_decode(File::get($file->getRealPath()), true);
                if ($content) {
                    $metrics[] = $content;
                }
            }
        }
        
        // Ordenar de más antiguo a más reciente para gráficos de series temporales
        usort($metrics, function ($a, $b) {
            return strcmp($a['fecha_procesamiento'] ?? '', $b['fecha_procesamiento'] ?? '');
        });
        
        return response()->json($metrics);
    }

    $path = "{$directory}/cf-{$date}.json";

    if (!File::exists($path)) {
        return response()->json(['error' => 'Métrica no encontrada para la fecha: ' . $date], 404);
    }

    return response()->json(json_decode(File::get($path), true));
});
