<?php

namespace App\Services;

use App\Models\CategoriaIncidencia;
use App\Models\Direccion;
use App\Models\HistorialIncidencia;
use App\Models\Incidencia;
use App\Models\Territorio;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class IncidenciaService
{
    protected IncidentGroupingService $groupingService;

    public function __construct(IncidentGroupingService $groupingService)
    {
        $this->groupingService = $groupingService;
    }

    /**
     * Calcula la prioridad basada en el sub-tipo y cantidad de afectados.
     */
    public function calculatePriority(int $subTipoId, int $afectados): ?int
    {
        $subtipo = CategoriaIncidencia::find($subTipoId);
        if (! $subtipo || ! $subtipo->prioridad_id) {
            return null;
        }

        $basePriorityId = $subtipo->prioridad_id;

        if ($afectados >= 10) {
            if ($basePriorityId == 2) return 1; // Alta -> Crítica
            if ($basePriorityId == 3) return 2; // Media -> Alta
            if ($basePriorityId == 4) return 3; // Baja -> Media
        }

        return $basePriorityId;
    }

    /**
     * Valida y guarda un arreglo de recursos Base64 de manera segura.
     */
    public function processBase64Resources(Incidencia $incidencia, array $recursos)
    {
        $disk = env('FILESYSTEM_DISK', 'public');

        foreach ($recursos as $base64Image) {
            // Extraer la data codificada
            if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
                $base64Data = substr($base64Image, strpos($base64Image, ',') + 1);
            } else {
                $base64Data = $base64Image;
            }

            $imageDecoded = base64_decode($base64Data, true);
            if ($imageDecoded === false) {
                continue; // No es un base64 válido
            }

            // Validar MIME Type real por seguridad
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_buffer($finfo, $imageDecoded);
            finfo_close($finfo);

            // Permitir solo formatos de imagen seguros
            $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!in_array($mimeType, $allowedMimeTypes)) {
                continue; // Archivo no permitido o código malicioso inyectado
            }

            // Mapear mime type a extensión segura
            $extension = str_replace('image/', '', $mimeType);
            if ($extension === 'jpeg') $extension = 'jpg';

            $fileName = 'incidencias/' . Str::uuid() . '.' . $extension;
            
            Storage::disk($disk)->put($fileName, $imageDecoded);
            
            $incidencia->recursos()->create([
                'url' => $fileName,
                'tipo' => 'imagen',
            ]);
        }
    }

    /**
     * Crea una incidencia agrupada o nueva dentro de una transacción.
     */
    public function createIncidencia(array $data, $user): array
    {
        return DB::transaction(function () use ($data, $user) {
            $direccionId = $data['direccion_id'] ?? null;
            
            // Lógica de agrupamiento
            if ($direccionId) {
                $direccion = Direccion::find($direccionId);
                if ($direccion) {
                    $similar = $this->groupingService->findSimilarIncident(
                        (int) $data['tipo_incidencia_id'],
                        (int) $data['sub_tipo_incidencia_id'],
                        (float) $direccion->latitud,
                        (float) $direccion->longitud
                    );

                    if ($similar) {
                        $similar->cantidad_afectados_incidencia += 1;
                        $similar->prioridad_id = $this->calculatePriority($similar->sub_tipo_incidencia_id, $similar->cantidad_afectados_incidencia);
                        $similar->save();

                        if ($user) {
                            $exists = DB::table('usuario_incidencia')
                                ->where('user_id', $user->id)
                                ->where('reporte_incidencia_id', $similar->id)
                                ->exists();
                            
                            if (! $exists) {
                                $similar->reportantes()->attach($user->id, ['created_by' => $user->id]);
                            }

                            HistorialIncidencia::create([
                                'incidencia_id' => $similar->id,
                                'estado_id' => $similar->estado_id,
                                'usuario_id' => $user->id,
                                'comentario' => '[VINCULADO] ' . $data['incidencia_descripcion'],
                            ]);
                        }

                        $isReferenced = Incidencia::where('direccion_id', $direccion->id)->exists();
                        if (! $isReferenced) {
                            $direccion->delete();
                        }

                        return [
                            'message' => 'Incidencia agrupada con éxito con reporte similar existente.',
                            'data' => $similar->load(['direccion.territorio.pais', 'cliente', 'estado', 'institucion', 'tipo', 'subTipo', 'prioridad', 'operadores', 'reportantes'])
                        ];
                    }
                }
            }

            // Si no hay similar, se crea nueva
            $afectados = max((int) ($data['cantidad_afectados_incidencia'] ?? 1), 1);
            $prioridadId = $this->calculatePriority($data['sub_tipo_incidencia_id'], $afectados);

            $institucionId = $data['institucion_id'] ?? null;
            if (isset($data['sub_tipo_incidencia_id'])) {
                $subTipo = CategoriaIncidencia::find($data['sub_tipo_incidencia_id']);
                $institucionId = $subTipo ? $subTipo->institucion_id : $institucionId;
            }

            $incidencia = Incidencia::create([
                'incidencia_descripcion' => $data['incidencia_descripcion'],
                'direccion_id' => $direccionId,
                'cliente_id' => $user ? $user->id : null,
                'estado_id' => $data['estado_id'] ?? 1,
                'institucion_id' => $institucionId,
                'tipo_incidencia_id' => $data['tipo_incidencia_id'],
                'sub_tipo_incidencia_id' => $data['sub_tipo_incidencia_id'],
                'prioridad_id' => $prioridadId,
                'cantidad_afectados_incidencia' => $afectados,
                'version' => 1,
                'created_by' => $user ? $user->id : null,
            ]);

            if ($user) {
                $incidencia->reportantes()->attach($user->id, ['created_by' => $user->id]);
            }

            if (!empty($data['recursos'])) {
                $this->processBase64Resources($incidencia, $data['recursos']);
            }

            return [
                'message' => 'Incidencia creada con éxito',
                'data' => $incidencia->load(['direccion.territorio.pais', 'direccion.territorio.parent', 'cliente', 'estado', 'institucion', 'tipo', 'subTipo', 'prioridad', 'operadores', 'reportantes', 'recursos'])
            ];
        });
    }

    /**
     * Actualiza una incidencia existente.
     */
    public function updateIncidencia(Incidencia $incidencia, array $data, $user): array
    {
        return DB::transaction(function () use ($incidencia, $data, $user) {
            $subTipoId = $data['sub_tipo_incidencia_id'] ?? $incidencia->sub_tipo_incidencia_id;
            $afectados = $data['cantidad_afectados_incidencia'] ?? $incidencia->cantidad_afectados_incidencia;
            $prioridadId = $this->calculatePriority($subTipoId, $afectados);

            $institucionId = $incidencia->institucion_id;
            if ($subTipoId) {
                $subTipoObj = CategoriaIncidencia::find($subTipoId);
                if ($subTipoObj && $subTipoObj->institucion_id) {
                    $institucionId = $subTipoObj->institucion_id;
                }
            }

            $incidencia->update([
                'incidencia_descripcion' => $data['incidencia_descripcion'] ?? $incidencia->incidencia_descripcion,
                'direccion_id' => $data['direccion_id'] ?? $incidencia->direccion_id,
                'estado_id' => $data['estado_id'] ?? $incidencia->estado_id,
                'institucion_id' => $institucionId,
                'tipo_incidencia_id' => $data['tipo_incidencia_id'] ?? $incidencia->tipo_incidencia_id,
                'sub_tipo_incidencia_id' => $subTipoId,
                'prioridad_id' => $prioridadId,
                'cantidad_afectados_incidencia' => $afectados,
                'version' => $incidencia->version + 1,
                'updated_by' => $user ? $user->id : null,
            ]);

            if (!empty($data['recursos'])) {
                $this->processBase64Resources($incidencia, $data['recursos']);
            }

            return [
                'message' => 'Incidencia actualizada con éxito',
                'data' => $incidencia->load(['direccion.territorio.pais', 'direccion.territorio.parent', 'cliente', 'estado', 'institucion', 'tipo', 'subTipo', 'prioridad', 'operadores', 'reportantes', 'recursos'])
            ];
        });
    }
}
