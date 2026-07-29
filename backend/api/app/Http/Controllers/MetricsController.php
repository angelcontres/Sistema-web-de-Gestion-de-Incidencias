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
            return $this->getAllMetrics($directory, $prefix);
        }

        return $this->getMetricByDate($directory, $prefix, $date);
    }

    private function getAllMetrics($directory, $prefix)
    {
        if (! File::exists($directory)) {
            return response()->json([]);
        }

        $metrics = [];
        foreach (File::files($directory) as $file) {
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

    private function getMetricByDate($directory, $prefix, $date)
    {
        $path = "{$directory}/{$prefix}-{$date}.json";

        if (! File::exists($path) && File::exists($directory)) {
            foreach (File::files($directory) as $file) {
                if ($file->getExtension() === 'json' && str_starts_with($file->getFilename(), "{$prefix}-{$date}")) {
                    $path = $file->getRealPath();
                    break;
                }
            }
        }

        if (! File::exists($path)) {
            return response()->json(['error' => 'Métrica no encontrada para la fecha: '.$date], 404);
        }

        return response()->json(json_decode(File::get($path), true));
    }
}
