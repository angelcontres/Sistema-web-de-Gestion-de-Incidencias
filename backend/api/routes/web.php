<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

/**
 * Ruta para obtener la métrica Tasa de Éxito de Pruebas (TEP) y exponerla para Grafana
 */
Route::get('/api/v1/metrics/tep/{date?}', function ($date = null) {
    $directory = base_path('tests/metrics-stg/tep');

    if ($date === null) {
        if (! File::exists($directory)) {
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

    if (! File::exists($path)) {
        if (File::exists($directory)) {
            $files = File::files($directory);
            foreach ($files as $file) {
                if ($file->getExtension() === 'json' && str_starts_with($file->getFilename(), "tep-{$date}")) {
                    $path = $file->getRealPath();
                    break;
                }
            }
        }
    }

    if (! File::exists($path)) {
        return response()->json(['error' => 'Métrica no encontrada para la fecha: '.$date], 404);
    }

    return response()->json(json_decode(File::get($path), true));
});

/**
 * Ruta para obtener la métrica Cobertura Funcional (CF) y exponerla para Grafana
 */
Route::get('/api/v1/metrics/cf/{date?}', function ($date = null) {
    $directory = base_path('tests/metrics-stg/cf');

    if ($date === null) {
        if (! File::exists($directory)) {
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

    if (! File::exists($path)) {
        if (File::exists($directory)) {
            $files = File::files($directory);
            foreach ($files as $file) {
                if ($file->getExtension() === 'json' && str_starts_with($file->getFilename(), "cf-{$date}")) {
                    $path = $file->getRealPath();
                    break;
                }
            }
        }
    }

    if (! File::exists($path)) {
        return response()->json(['error' => 'Métrica no encontrada para la fecha: '.$date], 404);
    }

    return response()->json(json_decode(File::get($path), true));
});

/**
 * Ruta para obtener la métrica Densidad de Defectos (DD) y exponerla para Grafana
 */
Route::get('/api/v1/metrics/dd/{date?}', function ($date = null) {
    $directory = base_path('tests/metrics-stg/dd');

    if ($date === null) {
        if (! File::exists($directory)) {
            return response()->json([]);
        }

        $files = File::files($directory);
        $metrics = [];

        foreach ($files as $file) {
            if ($file->getExtension() === 'json' && str_starts_with($file->getFilename(), 'dd-')) {
                $content = json_decode(File::get($file->getRealPath()), true);
                if ($content) {
                    $metrics[] = $content;
                }
            }
        }

        usort($metrics, function ($a, $b) {
            return strcmp($a['fecha_procesamiento'] ?? '', $b['fecha_procesamiento'] ?? '');
        });

        return response()->json($metrics);
    }

    $path = "{$directory}/dd-{$date}.json";

    if (! File::exists($path)) {
        if (File::exists($directory)) {
            $files = File::files($directory);
            foreach ($files as $file) {
                if ($file->getExtension() === 'json' && str_starts_with($file->getFilename(), "dd-{$date}")) {
                    $path = $file->getRealPath();
                    break;
                }
            }
        }
    }

    if (! File::exists($path)) {
        return response()->json(['error' => 'Métrica no encontrada para la fecha: '.$date], 404);
    }

    return response()->json(json_decode(File::get($path), true));
});

/**
 * Ruta para obtener la métrica Vulnerabilidades Críticas (OWASP) (VCO) y exponerla para Grafana
 */
Route::get('/api/v1/metrics/vco/{date?}', function ($date = null) {
    $directory = base_path('tests/metrics-stg/vco');

    if ($date === null) {
        if (! File::exists($directory)) {
            return response()->json([]);
        }

        $files = File::files($directory);
        $metrics = [];

        foreach ($files as $file) {
            if ($file->getExtension() === 'json' && str_starts_with($file->getFilename(), 'vco-')) {
                $content = json_decode(File::get($file->getRealPath()), true);
                if ($content) {
                    $metrics[] = $content;
                }
            }
        }

        usort($metrics, function ($a, $b) {
            return strcmp($a['fecha_procesamiento'] ?? '', $b['fecha_procesamiento'] ?? '');
        });

        return response()->json($metrics);
    }

    $path = "{$directory}/vco-{$date}.json";

    if (! File::exists($path)) {
        if (File::exists($directory)) {
            $files = File::files($directory);
            foreach ($files as $file) {
                if ($file->getExtension() === 'json' && str_starts_with($file->getFilename(), "vco-{$date}")) {
                    $path = $file->getRealPath();
                    break;
                }
            }
        }
    }

    if (! File::exists($path)) {
        return response()->json(['error' => 'Métrica no encontrada para la fecha: '.$date], 404);
    }

    return response()->json(json_decode(File::get($path), true));
});

/**
 * Ruta para obtener la métrica Tiempo de Respuesta Promedio (TRP) y exponerla para Grafana
 */
Route::get('/api/v1/metrics/trp/{date?}', function ($date = null) {
    $directory = base_path('tests/metrics-stg/trp');

    if ($date === null) {
        if (! File::exists($directory)) {
            return response()->json([]);
        }

        $files = File::files($directory);
        $metrics = [];

        foreach ($files as $file) {
            if ($file->getExtension() === 'json' && str_starts_with($file->getFilename(), 'trp-')) {
                $content = json_decode(File::get($file->getRealPath()), true);
                if ($content) {
                    $metrics[] = $content;
                }
            }
        }

        usort($metrics, function ($a, $b) {
            return strcmp($a['fecha_procesamiento'] ?? '', $b['fecha_procesamiento'] ?? '');
        });

        return response()->json($metrics);
    }

    $path = "{$directory}/trp-{$date}.json";

    if (! File::exists($path)) {
        if (File::exists($directory)) {
            $files = File::files($directory);
            foreach ($files as $file) {
                if ($file->getExtension() === 'json' && str_starts_with($file->getFilename(), "trp-{$date}")) {
                    $path = $file->getRealPath();
                    break;
                }
            }
        }
    }

    if (! File::exists($path)) {
        return response()->json(['error' => 'Métrica no encontrada para la fecha: '.$date], 404);
    }

    return response()->json(json_decode(File::get($path), true));
});
