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
Schedule::command('sqa:vco')->dailyAt('02:00');

// Pasivas: Aunque son manuales/pasivas, se programan diariamente por la
// madrugada para asegurar el llenado histórico en el Data Warehouse
Schedule::command('sqa:dd')->dailyAt('03:00');  // Densidad de Defectos
Schedule::command('sqa:cf')->dailyAt('04:00');  // Cobertura Funcional
Schedule::command('sqa:tep')->dailyAt('05:00'); // Tasa de Éxito de Pruebas

