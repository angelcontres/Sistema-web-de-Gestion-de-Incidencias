<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NotificationController;
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
Route::post('/v1/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/v1/auth/register-citizen', [AuthController::class, 'register'])->middleware('throttle:3,1');
Route::post('/v1/auth/activate', [AuthController::class, 'activate']);

// Rutas de catálogos (protegidas por autenticación, accesibles para todos los usuarios logueados)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/v1/catalogs/countries', [CatalogoController::class, 'paises']);
    Route::get('/v1/catalogs/territories', [CatalogoController::class, 'territorios']);
    Route::get('/v1/catalogs/addresses', [CatalogoController::class, 'direcciones']);
    Route::get('/v1/catalogs/incident-categories', [CatalogoController::class, 'categoriasIncidencia']);
    Route::get('/v1/catalogs/institutions', [CatalogoController::class, 'instituciones']);
    Route::get('/v1/geocoding/reverse', [DireccionController::class, 'reverseGeocode']);
    Route::get('/v1/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/v1/dashboard/metrics', [DashboardController::class, 'metrics']);

    // Rutas del sistema de notificaciones en tiempo real
    Route::get('/v1/notificaciones', [NotificationController::class, 'index']);
    Route::put('/v1/notificaciones/leer-todas', [NotificationController::class, 'markAllAsRead']);
    Route::put('/v1/notificaciones/{id}/leer', [NotificationController::class, 'markAsRead']);
});

// Rutas protegidas por autenticación y permisos de recursos
Route::middleware(['auth:sanctum', CheckResourcePermission::class])->group(function () {
    Route::post('/v1/logout', [AuthController::class, 'logout']);
    Route::post('/v1/admin/users/invite', [\App\Http\Controllers\AdminUserController::class, 'invite'])->name('usuarios.invite');

    Route::get('/v1/me', [AuthController::class, 'me']);
    Route::post('/v1/refresh', [AuthController::class, 'refresh']);

    Route::get('/v1/me/menu', [UserMenuController::class, 'index']);

    Route::apiResource('v1/menu-options', OpcionMenuController::class)->names('opciones');
    Route::apiResource('v1/roles', RoleController::class)->names('roles');
    Route::post('v1/roles/{id}/permissions', [RoleController::class, 'assignPermissions'])->name('roles.assignPermissions');
    Route::apiResource('v1/permissions', PermisoController::class)->names('permisos');
    Route::apiResource('v1/users', UserController::class)->names('usuarios');

    Route::apiResource('v1/countries', PaisController::class)->names('paises');
    Route::apiResource('v1/territories', TerritorioController::class)->names('territorios');
    Route::apiResource('v1/addresses', DireccionController::class)->names('direcciones');
    Route::apiResource('v1/incident-categories', CategoriaIncidenciaController::class)->names('categorias');
    Route::apiResource('v1/incidents', IncidenciaController::class)->names('incidencias');
    Route::get('v1/incidents/{id}/historial', [IncidenciaController::class, 'getHistorial'])->name('incidencias.historial');
    Route::post('v1/incidents/{id}/comentarios', [IncidenciaController::class, 'addComment'])->name('incidencias.comentarios');

    Route::get('/v1/trp/performance-stats', [TrpController::class, 'performanceStats'])->name('trp.performanceStats');
    Route::get('/v1/trp/performance-logs/export', [TrpController::class, 'exportLogs'])->name('trp.exportLogs');
    Route::apiResource('v1/institutions', InstitucionController::class)->parameters([
        'institutions' => 'institucion',
    ])->names('instituciones');
    Route::apiResource('v1/priorities', PrioridadController::class)->parameters([
        'priorities' => 'prioridad',
    ])->names('prioridades');
});
