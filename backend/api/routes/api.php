<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// Rutas públicas
Route::post('/v1/login', [AuthController::class, 'login']);

// Rutas protegidas por autenticación
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/v1/logout', [AuthController::class, 'logout']);

    Route::get('/v1/me', [AuthController::class, 'me']);
});

// Endpoint de prueba sin base de datos
Route::get('/productos', function () {
    $productosFalsos = [
        [
            'id' => 1,
            'nombre' => 'Laptop Lenovo',
            'estado' => 'Disponible',
            'componentes' => ['RAM' => '20GB', 'Almacenamiento' => 'NVMe'],
        ],
        [
            'id' => 2,
            'nombre' => 'Teclado Mecánico',
            'estado' => 'Agotado',
            'componentes' => ['Switches' => 'Brown'],
        ],
    ];

    // Laravel convierte automáticamente los arrays de PHP a formato JSON
    return response()->json([
        'status' => 'success',
        'data' => $productosFalsos,
    ], 200);
});
