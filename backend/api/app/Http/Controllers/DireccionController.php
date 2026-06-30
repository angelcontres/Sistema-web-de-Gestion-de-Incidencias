<?php

namespace App\Http\Controllers;

use App\Models\Direccion;
use Illuminate\Http\Request;

class DireccionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Direccion::with(['territorio.pais']);

        $user = auth()->user();
        if ($user && !$user->roles()->where('nombre', 'Admin')->exists() && $user->pais_id) {
            $query->whereHas('territorio', function ($q) use ($user) {
                $q->where('pais_id', $user->pais_id);
            });
        } else if ($request->has('territorio_id')) {
            $query->where('territorio_id', $request->input('territorio_id'));
        }

        return response()->json($query->orderBy('id', 'desc')->get(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'territorio_id' => 'required|exists:territorios,id',
            'detalle' => 'required|string|max:255',
            'referencia' => 'nullable|string|max:255',
            'codigo_postal' => 'nullable|string|max:20',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'activo' => 'boolean',
        ]);

        $user = auth()->user();
        if ($user && !$user->roles()->where('nombre', 'Admin')->exists() && $user->pais_id) {
            $territorio = \App\Models\Territorio::findOrFail($request->territorio_id);
            if ($territorio->pais_id != $user->pais_id) {
                return response()->json(['message' => 'El territorio seleccionado debe pertenecer a su país asignado.'], 403);
            }
        }

        $direccion = Direccion::create([
            'territorio_id' => $request->territorio_id,
            'detalle' => $request->detalle,
            'referencia' => $request->referencia,
            'codigo_postal' => $request->codigo_postal,
            'latitud' => $request->latitud,
            'longitud' => $request->longitud,
            'activo' => $request->input('activo', true),
        ]);

        return response()->json([
            'message' => 'Dirección creada con éxito',
            'data' => $direccion->load(['territorio.pais']),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $direccion = Direccion::with(['territorio.pais'])->findOrFail($id);
        
        $user = auth()->user();
        if ($user && !$user->roles()->where('nombre', 'Admin')->exists() && $user->pais_id && $direccion->territorio->pais_id != $user->pais_id) {
            return response()->json(['message' => 'No autorizado para ver esta dirección.'], 403);
        }

        return response()->json($direccion, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $direccion = Direccion::findOrFail($id);

        $user = auth()->user();
        if ($user && !$user->roles()->where('nombre', 'Admin')->exists() && $user->pais_id) {
            if ($direccion->territorio->pais_id != $user->pais_id) {
                return response()->json(['message' => 'No autorizado para modificar esta dirección.'], 403);
            }
            if ($request->has('territorio_id')) {
                $territorio = \App\Models\Territorio::findOrFail($request->territorio_id);
                if ($territorio->pais_id != $user->pais_id) {
                    return response()->json(['message' => 'El nuevo territorio seleccionado debe pertenecer a su país asignado.'], 403);
                }
            }
        }

        $request->validate([
            'territorio_id' => 'sometimes|required|exists:territorios,id',
            'detalle' => 'sometimes|required|string|max:255',
            'referencia' => 'nullable|string|max:255',
            'codigo_postal' => 'nullable|string|max:20',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'activo' => 'boolean',
        ]);

        $direccion->update($request->only(['territorio_id', 'detalle', 'referencia', 'codigo_postal', 'latitud', 'longitud', 'activo']));

        return response()->json([
            'message' => 'Dirección actualizada con éxito',
            'data' => $direccion->load(['territorio.pais']),
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $direccion = Direccion::findOrFail($id);

        $user = auth()->user();
        if ($user && !$user->roles()->where('nombre', 'Admin')->exists() && $user->pais_id && $direccion->territorio->pais_id != $user->pais_id) {
            return response()->json(['message' => 'No autorizado para eliminar esta dirección.'], 403);
        }

        $direccion->delete();

        return response()->json([
            'message' => 'Dirección eliminada con éxito',
        ], 200);
    }

    /**
     * Proxy para geocodificación reversa de Nominatim con fallback a BigDataCloud (evita CORS y bloqueos 429).
     */
    public function reverseGeocode(Request $request)
    {
        $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
        ]);

        $lat = $request->input('lat');
        $lng = $request->input('lng');

        // 1. Intentar con Nominatim (OpenStreetMap)
        try {
            $response = \Illuminate\Support\Facades\Http::timeout(3)
                ->withHeaders([
                    'User-Agent' => 'SistemaWebGestionIncidencias/1.0 (contacto: admin@sistema.local)',
                    'Accept-Language' => 'es'
                ])->get('https://nominatim.openstreetmap.org/reverse', [
                    'format' => 'json',
                    'lat' => $lat,
                    'lon' => $lng,
                    'zoom' => 18,
                    'addressdetails' => 1,
                ]);

            if ($response->successful()) {
                return response()->json($response->json(), 200);
            }
        } catch (\Exception $e) {
            // Continuar silenciosamente al plan B (Fallback)
        }

        // 2. Fallback: Intentar con BigDataCloud (API gratuita sin límite estricto de IP y con CORS)
        try {
            $response = \Illuminate\Support\Facades\Http::timeout(3)
                ->get('https://api.bigdatacloud.net/data/reverse-geocode-client', [
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'localityLanguage' => 'es'
                ]);

            if ($response->successful()) {
                $bdc = $response->json();
                
                // Mapear al formato de Nominatim para que el frontend lo procese igual
                $mapped = [
                    'address' => [
                        'country' => $bdc['countryName'] ?? null,
                        'country_code' => $bdc['countryCode'] ?? null,
                        'state' => $bdc['principalSubdivision'] ?? null,
                        'city' => $bdc['city'] ?? null,
                        'town' => $bdc['city'] ?? null,
                        'parish' => $bdc['locality'] ?? null,
                        'suburb' => $bdc['locality'] ?? null,
                        'neighbourhood' => $bdc['locality'] ?? null,
                        'postcode' => $bdc['postcode'] ?? null,
                        'road' => $bdc['locality'] ?? null,
                    ],
                    'display_name' => implode(', ', array_filter([
                        $bdc['locality'] ?? null,
                        $bdc['city'] ?? null,
                        $bdc['principalSubdivision'] ?? null,
                        $bdc['countryName'] ?? null
                    ]))
                ];

                return response()->json($mapped, 200);
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error en todos los servicios de geocodificación: ' . $e->getMessage()
            ], 502);
        }

        return response()->json([
            'message' => 'No se pudo obtener información de geocodificación de ningún servicio.'
        ], 502);
    }
}
