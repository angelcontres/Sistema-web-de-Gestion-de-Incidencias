<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('etl:run')->everyThirtySeconds();

// =========================================================================
// Monitoreo SQA & Calidad (Carga al Data Warehouse OLAP)
// =========================================================================

// Activa: Ejecución automática diaria para analizar vulnerabilidades (VCO)
Schedule::command('sqa:vco')->everyThirtyMinutes();
// Pasivas:
Schedule::command('sqa:dd')->everyThirtyMinutes();  // Densidad de Defectos
Schedule::command('sqa:cf')->everyThirtyMinutes();  // Cobertura Funcional
Schedule::command('sqa:tep')->everyTwoHours(); // Tasa de Éxito de Pruebas

