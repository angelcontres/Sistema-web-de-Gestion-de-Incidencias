<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TrpController;
use App\Http\Controllers\CatalogoController;
use App\Http\Controllers\CategoriaIncidenciaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DireccionController;
use App\Http\Controllers\IncidenciaController;
use App\Http\Controllers\InstitucionController;
use App\Http\Controllers\OpcionMenuController;
use App\Http\Controllers\PaisController;
use App\Http\Controllers\PermisoController;
use App\Http\Controllers\PrioridadController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\TerritorioController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserMenuController;
use App\Http\Middleware\CheckResourcePermission;
use Illuminate\Support\Facades\Route;

// Rutas públicas
Route::post('/v1/login', [AuthController::class, 'login']);

// Rutas de catálogos (protegidas por autenticación, accesibles para todos los usuarios logueados)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/v1/catalogos/paises', [CatalogoController::class, 'paises']);
    Route::get('/v1/catalogos/territorios', [CatalogoController::class, 'territorios']);
    Route::get('/v1/catalogos/direcciones', [CatalogoController::class, 'direcciones']);
    Route::get('/v1/catalogos/categorias-incidencia', [CatalogoController::class, 'categoriasIncidencia']);
    Route::get('/v1/catalogos/instituciones', [CatalogoController::class, 'instituciones']);
    Route::get('/v1/geocodificacion/reversa', [DireccionController::class, 'reverseGeocode']);
    Route::get('/v1/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/v1/dashboard/metrics', [DashboardController::class, 'metrics']);
});

// Rutas protegidas por autenticación y permisos de recursos
Route::middleware(['auth:sanctum', CheckResourcePermission::class])->group(function () {
    Route::post('/v1/logout', [AuthController::class, 'logout']);

    Route::get('/v1/me', [AuthController::class, 'me']);
    Route::post('/v1/refresh', [AuthController::class, 'refresh']);

    Route::get('/v1/me/menu', [UserMenuController::class, 'index']);

    Route::apiResource('v1/opciones-menu', OpcionMenuController::class);
    Route::apiResource('v1/roles', RoleController::class);
    Route::post('v1/roles/{id}/permisos', [RoleController::class, 'assignPermissions']);
    Route::apiResource('v1/permisos', PermisoController::class);
    Route::apiResource('v1/usuarios', UserController::class);

    Route::apiResource('v1/paises', PaisController::class);
    Route::apiResource('v1/territorios', TerritorioController::class);
    Route::apiResource('v1/direcciones', DireccionController::class);
    Route::apiResource('v1/categorias-incidencia', CategoriaIncidenciaController::class);
    Route::apiResource('v1/incidencias', IncidenciaController::class);
    Route::get('v1/incidencias/{id}/historial', [IncidenciaController::class, 'getHistorial']);
    Route::post('v1/incidencias/{id}/comentarios', [IncidenciaController::class, 'addComment']);

    Route::get('/v1/trp/performance-stats', [TrpController::class, 'performanceStats']);
    Route::get('/v1/trp/performance-logs/export', [TrpController::class, 'exportLogs']);
    Route::apiResource('v1/instituciones', InstitucionController::class)->parameters([
        'instituciones' => 'institucion',
    ]);
    Route::apiResource('v1/prioridades', PrioridadController::class)->parameters([
        'prioridades' => 'prioridad',
    ]);
});
