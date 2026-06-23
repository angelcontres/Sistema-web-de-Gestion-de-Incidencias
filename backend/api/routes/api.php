<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\OpcionMenuController;
use App\Http\Controllers\PermisoController;
use App\Http\Controllers\RoleController;
use Illuminate\Support\Facades\Route;

// Rutas públicas
Route::post('/v1/login', [AuthController::class, 'login']);

// Rutas protegidas por autenticación
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/v1/logout', [AuthController::class, 'logout']);

    Route::get('/v1/me', [AuthController::class, 'me']);

    Route::apiResource('opciones-menu', OpcionMenuController::class);
    Route::apiResource('v1/roles', RoleController::class);
    Route::post('v1/roles/{id}/permisos', [RoleController::class, 'assignPermissions']);
    Route::apiResource('v1/permisos', PermisoController::class);
});
