<?php

use App\Http\Controllers\MetricsController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [WelcomeController::class, 'index']);

Route::get('/api/v1/metrics/tep/{date?}', [MetricsController::class, 'tep']);
Route::get('/api/v1/metrics/cf/{date?}', [MetricsController::class, 'cf']);
Route::get('/api/v1/metrics/dd/{date?}', [MetricsController::class, 'dd']);
Route::get('/api/v1/metrics/vco/{date?}', [MetricsController::class, 'vco']);
Route::get('/api/v1/metrics/trp/{date?}', [MetricsController::class, 'trp']);
