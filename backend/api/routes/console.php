<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('etl:run')->everyFiveMinutes();

// =========================================================================
// Monitoreo SQA & Calidad (Carga al Data Warehouse OLAP)
// =========================================================================

// Activa: Ejecución automática diaria para analizar vulnerabilidades (VCO)
Schedule::command('sqa:vco')->dailyAt('02:00')->timezone('America/Guayaquil');
// Pasivas:
Schedule::command('sqa:dd')->dailyAt('03:00')->timezone('America/Guayaquil');  // Densidad de Defectos
Schedule::command('sqa:cf')->dailyAt('04:00')->timezone('America/Guayaquil');  // Cobertura Funcional
Schedule::command('sqa:tep')->dailyAt('05:00')->timezone('America/Guayaquil'); // Tasa de Éxito de Pruebas

