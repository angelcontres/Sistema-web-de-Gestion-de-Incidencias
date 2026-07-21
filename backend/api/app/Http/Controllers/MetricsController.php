<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\File;

class MetricsController extends Controller
{
    public function tep($date = null)
    {
        return $this->processMetricDirectory(base_path('tests/metrics-stg/tep'), 'tep', $date);
    }

    public function cf($date = null)
    {
        return $this->processMetricDirectory(base_path('tests/metrics-stg/cf'), 'cf', $date);
    }

    public function dd($date = null)
    {
        return $this->processMetricDirectory(base_path('tests/metrics-stg/dd'), 'dd', $date);
    }

    public function vco($date = null)
    {
        return $this->processMetricDirectory(base_path('tests/metrics-stg/vco'), 'vco', $date);
    }

    public function trp($date = null)
    {
        return $this->processMetricDirectory(base_path('tests/metrics-stg/trp'), 'trp', $date);
    }

    private function processMetricDirectory($directory, $prefix, $date = null)
    {
        if ($date === null) {
            if (! File::exists($directory)) {
                return response()->json([]);
            }

            $files = File::files($directory);
            $metrics = [];

            foreach ($files as $file) {
                if ($file->getExtension() === 'json' && str_starts_with($file->getFilename(), "{$prefix}-")) {
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

        $path = "{$directory}/{$prefix}-{$date}.json";

        if (! File::exists($path)) {
            if (File::exists($directory)) {
                $files = File::files($directory);
                foreach ($files as $file) {
                    if ($file->getExtension() === 'json' && str_starts_with($file->getFilename(), "{$prefix}-{$date}")) {
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
    }
}
