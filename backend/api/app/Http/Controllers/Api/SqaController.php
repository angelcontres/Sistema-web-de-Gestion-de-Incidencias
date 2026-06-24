<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PerformanceLog;
use Illuminate\Support\Facades\DB;

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
}
