<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::post('/v1/login', [AuthController::class, 'login']);

// Endpoint de prueba sin base de datos
Route::get('/productos', function () {
    $productosFalsos = [
        [
            'id' => 1,
            'nombre' => 'Laptop Lenovo',
            'estado' => 'Disponible',
            'componentes' => ['RAM' => '20GB', 'Almacenamiento' => 'NVMe']
        ],
        [
            'id' => 2,
            'nombre' => 'Teclado Mecánico',
            'estado' => 'Agotado',
            'componentes' => ['Switches' => 'Brown']
        ]
    ];

    // Laravel convierte automáticamente los arrays de PHP a formato JSON
    return response()->json([
        'status' => 'success',
        'data' => $productosFalsos
    ], 200);
});