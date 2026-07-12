<?php

namespace App\Jobs\Etl;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;

class LoadSqaMetricsFromJsonJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        // En lugar de leer archivos JSON obsoletos, ejecutamos directamente los
        // comandos de Artisan que calculan y guardan las métricas en el esquema OLAP.
        Artisan::call('sqa:vco');
        Artisan::call('sqa:dd');
        Artisan::call('sqa:cf');
        Artisan::call('sqa:tep');
    }
}
