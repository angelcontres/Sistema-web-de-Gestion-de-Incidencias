<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\OpcionMenuController;
use App\Http\Controllers\PermisoController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;

use \App\Http\Middleware\CheckResourcePermission;

use \Illuminate\Support\Facades\Route;

// Rutas públicas
Route::post('/v1/login', [AuthController::class, 'login']);

// Rutas protegidas por autenticación
Route::middleware(['auth:sanctum', CheckResourcePermission::class])->group(function () {
    Route::post('/v1/logout', [AuthController::class, 'logout']);

    Route::get('/v1/me', [AuthController::class, 'me']);
    Route::get('/v1/me/menu', [\App\Http\Controllers\UserMenuController::class, 'index']);

    Route::apiResource('v1/opciones-menu', OpcionMenuController::class);
    Route::apiResource('v1/roles', RoleController::class);
    Route::post('v1/roles/{id}/permisos', [RoleController::class, 'assignPermissions']);
    Route::apiResource('v1/permisos', PermisoController::class);
    Route::apiResource('v1/usuarios', UserController::class);
});
