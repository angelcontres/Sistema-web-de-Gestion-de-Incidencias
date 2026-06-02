<?php

use App\Http\Controllers\OpcionMenuController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Solo crea las rutas para index y show
// Route::apiResource('/opciones-menu', OpcionMenuController::class)->only(['index', 'show']);


/**
 * Ruta base para opciones de menú
 * Con apiResourse se mapean todas las funciones REST, por lo cual no se requiere definir cada ruta individualmente.
 * GET     /opciones-menu           index
 * POST    /opciones-menu           store
 * GET     /opciones-menu/{id}      show
 * PUT     /opciones-menu/{id}      update
 * DELETE  /opciones-menu/{id}      destroy
 * La respectiva lógica se encontrará en el controlador OpcionMenuController
 */
Route::apiResource('/opciones-menu', OpcionMenuController::class);
// Route::post('/opciones-menu', OpcionMenuController::class->store('',''));


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