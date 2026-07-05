<?php

namespace App\Http\Middleware;

use App\Models\PerformanceLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MeasureResponseTime
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // El tiempo de inicio se toma de la variable global LARAVEL_START si está definida,
        // o en su defecto del $_SERVER['REQUEST_TIME_FLOAT']
        return $next($request);
    }

    /**
     * Handle tasks after the response has been sent to the browser.
     */
    public function terminate(Request $request, Response $response): void
    {
        // Ignorar las peticiones de Preflight de CORS
        if ($request->method() === 'OPTIONS') {
            return;
        }

        $startTime = defined('LARAVEL_START') ? LARAVEL_START : $request->server('REQUEST_TIME_FLOAT');
        if (! $startTime) {
            return;
        }

        $endTime = microtime(true);
        $durationMs = round(($endTime - $startTime) * 1000);

        if ($durationMs > 100) {
            PerformanceLog::create([
                'trp' => $durationMs,
                'endpoint' => $request->path(),
                'metodo' => $request->method(),
                'logged_at' => now(),
            ]);
        }

    }
}
