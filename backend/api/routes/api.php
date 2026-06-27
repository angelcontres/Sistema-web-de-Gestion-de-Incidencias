<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\CatalogoController;
use App\Http\Controllers\OpcionMenuController;
use App\Http\Controllers\PermisoController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserMenuController;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\CheckResourcePermission;

// Rutas públicas
Route::post('/v1/login', [AuthController::class, 'login']);

// Rutas de catálogos (protegidas por autenticación, accesibles para todos los usuarios logueados)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/v1/catalogos/paises', [CatalogoController::class, 'paises']);
    Route::get('/v1/catalogos/territorios', [CatalogoController::class, 'territorios']);
    Route::get('/v1/catalogos/direcciones', [CatalogoController::class, 'direcciones']);
    Route::get('/v1/catalogos/categorias-incidencia', [CatalogoController::class, 'categoriasIncidencia']);
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
});
