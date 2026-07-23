<?php

namespace App\Http\Controllers;

use App\Http\Requests\DireccionesRequest;
use App\Models\Direccion;
use App\Models\Territorio;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class DireccionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Direccion::with(['territorio.pais']);

        $user = auth()->user();
        if ($user && ! $user->roles()->where('nombre', 'Admin')->exists() && $user->pais_id) {
            $query->whereHas('territorio', function ($q) use ($user) {
                $q->where('pais_id', $user->pais_id);
            });
        } elseif ($request->has('territorio_id')) {
            $query->where('territorio_id', $request->input('territorio_id'));
        }

        if ($request->query('all') === 'true' || $request->query('all') === '1') {
            return response()->json($query->orderBy('id', 'desc')->get(), 200);
        }

        $perPage = $request->input('per_page', 15);

        return response()->json($query->orderBy('id', 'desc')->paginate($perPage), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(DireccionesRequest $request)
    {
        $user = auth()->user();
        if ($user && ! $user->roles()->where('nombre', 'Admin')->exists() && $user->pais_id) {
            $territorio = Territorio::findOrFail($request->territorio_id);
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

        Cache::forget('catalogo_direcciones_all');
        Cache::forget('catalogo_direcciones_'.$direccion->territorio_id);

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

        /** @var User|null $user */
        $user = auth()->user();
        if ($user && ! $user->roles()->where('nombre', 'Admin')->exists() && $user->pais_id && $direccion->territorio?->pais_id != $user->pais_id) {
            return response()->json(['message' => 'No autorizado para ver esta dirección.'], 403);
        }

        return response()->json($direccion, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(DireccionesRequest $request, $id)
    {
        $direccion = Direccion::findOrFail($id);

        /** @var User|null $user */
        $user = auth()->user();
        if ($user && ! $user->roles()->where('nombre', 'Admin')->exists() && $user->pais_id) {
            if ($direccion->territorio?->pais_id != $user->pais_id) {
                return response()->json(['message' => 'No autorizado para modificar esta dirección.'], 403);
            }
            if ($request->has('territorio_id')) {
                $territorio = Territorio::findOrFail($request->territorio_id);
                if ($territorio->pais_id != $user->pais_id) {
                    return response()->json(['message' => 'El nuevo territorio seleccionado debe pertenecer a su país asignado.'], 403);
                }
            }
        }

        // Remember old territorio_id to clear its cache
        $oldTerritorioId = $direccion->territorio_id;

        $direccion->update($request->only([
            'territorio_id',
            'detalle',
            'referencia',
            'codigo_postal',
            'latitud',
            'longitud',
            'activo',
        ]));

        Cache::forget('catalogo_direcciones_all');
        Cache::forget('catalogo_direcciones_'.$oldTerritorioId);
        Cache::forget('catalogo_direcciones_'.$direccion->territorio_id);

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

        /** @var User|null $user */
        $user = auth()->user();
        if ($user && ! $user->roles()->where('nombre', 'Admin')->exists() && $user->pais_id && $direccion->territorio?->pais_id != $user->pais_id) {
            return response()->json(['message' => 'No autorizado para eliminar esta dirección.'], 403);
        }

        $territorioId = $direccion->territorio_id;
        $direccion->delete();

        Cache::forget('catalogo_direcciones_all');
        Cache::forget('catalogo_direcciones_'.$territorioId);

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
        $result = null;

        // 1. Intentar con Nominatim (OpenStreetMap)
        try {
            $response = Http::timeout(3)
                ->withoutVerifying()
                ->withHeaders([
                    'User-Agent' => 'SistemaWebGestionIncidencias/1.0 (contacto: admin@sistema.local)',
                    'Accept-Language' => 'es',
                ])->get('https://nominatim.openstreetmap.org/reverse', [
                    'format' => 'json',
                    'lat' => $lat,
                    'lon' => $lng,
                    'zoom' => 18,
                    'addressdetails' => 1,
                ]);

            if ($response->successful()) {
                $result = $response->json();
            }
        } catch (\Exception $e) {
            // Continuar silenciosamente al plan B (Fallback)
        }

        // 2. Fallback: Intentar con BigDataCloud
        if (! $result) {
            try {
                $response = Http::timeout(3)
                    ->withoutVerifying()
                    ->get('https://api.bigdatacloud.net/data/reverse-geocode-client', [
                        'latitude' => $lat,
                        'longitude' => $lng,
                        'localityLanguage' => 'es',
                    ]);

                if ($response->successful()) {
                    $bdc = $response->json();

                    $result = [
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
                            $bdc['countryName'] ?? null,
                        ])),
                    ];
                }
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Error en todos los servicios de geocodificación: '.$e->getMessage(),
                ], 502);
            }
        }

        if ($result) {
            // Buscar la parroquia por código postal
            $postcode = $result['address']['postcode'] ?? null;
            if ($postcode) {
                // Remover ceros a la izquierda para asegurar coincidencias si el seeder las guardó como numéricos
                $codigoLimpio = (string) (int) $postcode;

                $territorio = Territorio::where('tipo', 'Parroquia')
                    ->where(function ($query) use ($postcode, $codigoLimpio) {
                        $query->where('codigo', $postcode)
                            ->orWhere('codigo', $codigoLimpio);
                    })->first();

                if ($territorio) {
                    $canton = $territorio->parent;
                    $provincia = $canton ? $canton->parent : null;

                    $result['territorio_detectado'] = [
                        'parroquia_id' => $territorio->id,
                        'canton_id' => $canton ? $canton->id : null,
                        'provincia_id' => $provincia ? $provincia->id : null,
                        'pais_id' => $territorio->pais_id,
                    ];
                } else {
                    // Fallback 1: Buscar si alguna Dirección previa ya tiene registrado este código postal
                    $direccionMapeada = Direccion::with('territorio')
                        ->where('codigo_postal', $postcode)
                        ->first();

                    if ($direccionMapeada && $direccionMapeada->territorio) {
                        $territorio = $direccionMapeada->territorio;
                        $canton = $territorio->parent;
                        $provincia = $canton ? $canton->parent : null;

                        $result['territorio_detectado'] = [
                            'parroquia_id' => $territorio->id,
                            'canton_id' => $canton ? $canton->id : null,
                            'provincia_id' => $provincia ? $provincia->id : null,
                            'pais_id' => $territorio->pais_id,
                        ];
                    } else {
                        // Fallback 2: Buscar Cantón por los primeros 4 dígitos del código postal (Ej: 170135 -> 1701)
                        $padded = str_pad($postcode, 6, '0', STR_PAD_LEFT);
                        $cantonCode = substr($padded, 0, 4);
                        $cantonCodeLimpio = (string) (int) $cantonCode;

                        $canton = Territorio::where('tipo', 'Canton')
                            ->where(function ($query) use ($cantonCode, $cantonCodeLimpio) {
                                $query->where('codigo', $cantonCode)
                                    ->orWhere('codigo', $cantonCodeLimpio);
                            })->first();

                        if ($canton) {
                            $provincia = $canton->parent;
                            $result['territorio_detectado'] = [
                                'parroquia_id' => null,
                                'canton_id' => $canton->id,
                                'provincia_id' => $provincia ? $provincia->id : null,
                                'pais_id' => $canton->pais_id,
                            ];
                        }
                    }
                }
            }

            return response()->json($result, 200);
        }

        return response()->json([
            'message' => 'No se pudo obtener información de geocodificación de ningún servicio.',
        ], 502);
    }
}
