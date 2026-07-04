<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PerformanceLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
class SqaController extends Controller
{
    public function performanceStats()
    {
        // 1. TRP over time (last 24 hours, grouped by hour)
        $timeline = PerformanceLog::where('logged_at', '>=', now()->subDay())
            ->select(
                DB::raw("DATE_TRUNC('hour', logged_at) as hour"),
                DB::raw('ROUND(AVG(trp)) as avg_trp')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        // 2. Top 5 slowest endpoints
        $slowestEndpoints = PerformanceLog::select(
            'endpoint',
            'metodo',
            DB::raw('ROUND(AVG(trp)) as avg_trp'),
            DB::raw('MAX(trp) as max_trp'),
            DB::raw('COUNT(*) as total_requests')
        )
            ->groupBy('endpoint', 'metodo')
            ->orderByDesc('avg_trp')
            ->limit(5)
            ->get();

        return response()->json([
            'timeline' => $timeline,
            'top_slowest' => $slowestEndpoints,
        ]);
    }

    public function exportLogs(Request $request)
    {
        $format = $request->query('format', 'csv');
        $fileName = 'performance_logs_' . date('Y_m_d_H_i_s') . '.' . $format;

        $headers = [
            'Content-Type' => $format === 'csv' ? 'text/csv' : 'text/plain',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            'Cache-Control' => 'no-store, no-cache',
        ];

        $response = new StreamedResponse(function () use ($format) {
            $handle = fopen('php://output', 'w');
            
            $separator = $format === 'csv' ? ',' : "\t";

            // Header
            fputcsv($handle, ['ID', 'TRP (ms)', 'Endpoint', 'Metodo', 'Logged At'], $separator);

            // Chunk to avoid memory issues
            PerformanceLog::orderBy('logged_at', 'desc')->chunk(1000, function ($logs) use ($handle, $separator) {
                foreach ($logs as $log) {
                    fputcsv($handle, [
                        $log->id,
                        $log->trp,
                        $log->endpoint,
                        $log->metodo,
                        $log->logged_at,
                    ], $separator);
                }
            });

            fclose($handle);
        }, 200, $headers);

        return $response;
    }
}
