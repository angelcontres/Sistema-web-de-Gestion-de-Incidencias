<?php

namespace App\Jobs\Etl;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Services\TimezoneService;

class SyncDimensionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $this->syncDimTiempo();
        $this->syncDimTerritorio();
        $this->syncDimCategoria();
        $this->syncDimEstado();
        $this->syncDimPrioridad();
        $this->syncDimInstitucion();
        $this->syncDimUsuario();
        $this->syncDimMetric();
    }

    private function syncDimTiempo(): void
    {
        // Generar registros de tiempo por hora para los últimos 30 días y los siguientes 2 días
        $start = TimezoneService::nowLocal()->subDays(30)->startOfDay();
        $end = TimezoneService::nowLocal()->addDays(2)->endOfDay();

        $records = [];
        for ($date = $start->copy(); $date->lte($end); $date->addHour()) {
            $id = (int)$date->format('YmdH');
            $records[] = [
                'id' => $id,
                'fecha' => $date->toDateTimeString(),
                'anio' => $date->year,
                'mes' => $date->month,
                'dia' => $date->day,
                'hora' => $date->hour,
                'trimestre' => ceil($date->month / 3),
                'dia_semana' => $date->locale('es')->dayName,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (count($records) >= 500) {
                DB::table('metrics.dim_tiempo')->upsert($records, ['id'], ['fecha', 'anio', 'mes', 'dia', 'hora', 'trimestre', 'dia_semana', 'updated_at']);
                $records = [];
            }
        }

        if (!empty($records)) {
            DB::table('metrics.dim_tiempo')->upsert($records, ['id'], ['fecha', 'anio', 'mes', 'dia', 'hora', 'trimestre', 'dia_semana', 'updated_at']);
        }
    }

    private function syncDimTerritorio(): void
    {
        // 1. Cargar datos de Ecuador desde ecuador.json
        $jsonPath = database_path('seeders/data/ecuador.json');
        $ecuadorData = [];
        if (\Illuminate\Support\Facades\File::exists($jsonPath)) {
            $ecuadorData = json_decode(\Illuminate\Support\Facades\File::get($jsonPath), true);
        }

        // 2. Traer todos los territorios de la base de datos indexados por código para cruzar IDs
        $dbTerritorios = DB::table('territorios')->get();
        $dbTerritoriosByCodigo = $dbTerritorios->whereNotNull('codigo')->keyBy('codigo');
        $dbTerritoriosById = $dbTerritorios->keyBy('id');
        $paises = DB::table('paises')->get()->keyBy('id');

        $processedIds = [];
        $records = [];

        // 3. Procesar datos del JSON de Ecuador
        if (!empty($ecuadorData)) {
            foreach ($ecuadorData as $provId => $provData) {
                if (!isset($provData['provincia'])) continue;
                $provName = mb_convert_case($provData['provincia'], MB_CASE_TITLE, 'UTF-8');

                // Resolver ID de la provincia en la DB
                $dbProv = $dbTerritoriosByCodigo->get((string)$provId);
                if ($dbProv) {
                    $records[] = [
                        'id' => $dbProv->id,
                        'pais' => 'Ecuador',
                        'provincia' => $provName,
                        'canton' => 'N/A',
                        'parroquia' => 'N/A',
                        'codigo' => (string)$provId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    $processedIds[$dbProv->id] = true;
                }

                if (!isset($provData['cantones']) || !is_array($provData['cantones'])) continue;

                foreach ($provData['cantones'] as $cantId => $cantData) {
                    if (!isset($cantData['canton'])) continue;
                    $cantName = mb_convert_case($cantData['canton'], MB_CASE_TITLE, 'UTF-8');

                    // Resolver ID del cantón en la DB
                    $dbCant = $dbTerritoriosByCodigo->get((string)$cantId);
                    if ($dbCant) {
                        $records[] = [
                            'id' => $dbCant->id,
                            'pais' => 'Ecuador',
                            'provincia' => $provName,
                            'canton' => $cantName,
                            'parroquia' => 'N/A',
                            'codigo' => (string)$cantId,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                        $processedIds[$dbCant->id] = true;
                    }

                    if (!isset($cantData['parroquias']) || !is_array($cantData['parroquias'])) continue;

                    foreach ($cantData['parroquias'] as $parrId => $parrNameRaw) {
                        $parrName = mb_convert_case($parrNameRaw, MB_CASE_TITLE, 'UTF-8');

                        // Resolver ID de la parroquia en la DB
                        $dbParr = $dbTerritoriosByCodigo->get((string)$parrId);
                        if ($dbParr) {
                            $records[] = [
                                'id' => $dbParr->id,
                                'pais' => 'Ecuador',
                                'provincia' => $provName,
                                'canton' => $cantName,
                                'parroquia' => $parrName,
                                'codigo' => (string)$parrId,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                            $processedIds[$dbParr->id] = true;
                        }
                    }
                }
            }
        }

        // 4. Procesar otros territorios de la DB que no estaban en el JSON (o de otros países como Perú/México)
        foreach ($dbTerritorios as $t) {
            if (isset($processedIds[$t->id])) continue;

            $paisName = isset($paises[$t->pais_id]) ? $paises[$t->pais_id]->nombre : null;
            $provincia = null;
            $canton = null;
            $parroquia = null;

            $curr = $t;
            while ($curr !== null) {
                $tipoLower = strtolower($curr->tipo ?? '');
                if (in_array($tipoLower, ['provincia', 'estado', 'departamento'])) {
                    $provincia = $curr->nombre;
                } elseif (in_array($tipoLower, ['canton', 'municipio', 'provincia_hijo', 'alcaldia'])) {
                    $canton = $curr->nombre;
                } elseif (in_array($tipoLower, ['parroquia', 'distrito', 'leaf'])) {
                    $parroquia = $curr->nombre;
                }
                
                $curr = $curr->parent_id && isset($dbTerritoriosById[$curr->parent_id]) 
                    ? $dbTerritoriosById[$curr->parent_id] 
                    : null;
            }

            if (empty($parroquia) && strtolower($t->tipo ?? '') === 'parroquia') {
                $parroquia = $t->nombre;
            }

            $records[] = [
                'id' => $t->id,
                'pais' => $paisName ?: 'N/A',
                'provincia' => ($provincia ?: $t->nombre) ?: 'N/A',
                'canton' => $canton ?: 'N/A',
                'parroquia' => $parroquia ?: 'N/A',
                'codigo' => $t->codigo ?: 'N/A',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // 5. Cargar en la BD metrics.dim_territorio
        if (!empty($records)) {
            foreach (array_chunk($records, 500) as $chunk) {
                DB::table('metrics.dim_territorio')->upsert($chunk, ['id'], ['pais', 'provincia', 'canton', 'parroquia', 'codigo', 'updated_at']);
            }
        }
    }

    private function syncDimCategoria(): void
    {
        $categorias = DB::table('categorias_incidencia')->get();
        $categoriasMap = $categorias->keyBy('id');

        $records = [];
        foreach ($categorias as $c) {
            $parentName = $c->parent_id && isset($categoriasMap[$c->parent_id]) 
                ? $categoriasMap[$c->parent_id]->nombre 
                : 'N/A';

            $records[] = [
                'id' => $c->id,
                'nombre' => $c->nombre,
                'categoria_padre' => $parentName,
                'descripcion' => $c->descripcion ?: 'N/A',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($records)) {
            DB::table('metrics.dim_categoria')->upsert($records, ['id'], ['nombre', 'categoria_padre', 'descripcion', 'updated_at']);
        }
    }

    private function syncDimEstado(): void
    {
        $estados = DB::table('estados_incidencia')->get();
        $records = [];
        foreach ($estados as $e) {
            $records[] = [
                'id' => $e->id,
                'nombre' => $e->nombre,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($records)) {
            DB::table('metrics.dim_estado')->upsert($records, ['id'], ['nombre', 'updated_at']);
        }
    }

    private function syncDimPrioridad(): void
    {
        $prioridades = DB::table('prioridades')->get();
        $records = [];
        foreach ($prioridades as $p) {
            $records[] = [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($records)) {
            DB::table('metrics.dim_prioridad')->upsert($records, ['id'], ['nombre', 'updated_at']);
        }
    }

    private function syncDimInstitucion(): void
    {
        $instituciones = DB::table('instituciones')->get();
        $records = [];
        foreach ($instituciones as $i) {
            $records[] = [
                'id' => $i->id,
                'nombre' => $i->nombre,
                'siglas' => $i->siglas,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($records)) {
            DB::table('metrics.dim_institucion')->upsert($records, ['id'], ['nombre', 'siglas', 'updated_at']);
        }
    }

    private function syncDimUsuario(): void
    {
        $users = DB::table('users')->get();
        $records = [];
        foreach ($users as $u) {
            // Resolver rol principal
            $roleUser = DB::table('roles_users')
                ->join('roles', 'roles_users.rol_id', '=', 'roles.id')
                ->where('roles_users.user_id', $u->id)
                ->select('roles.nombre')
                ->first();
            
            $rolPrincipal = $roleUser ? $roleUser->nombre : ($u->created_by === null ? 'Administrador' : 'Usuario');

            $records[] = [
                'id' => $u->id,
                'username' => $u->username,
                'name' => $u->name,
                'email' => $u->email,
                'rol_principal' => $rolPrincipal,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($records)) {
            DB::table('metrics.dim_usuario')->upsert($records, ['id'], ['username', 'name', 'email', 'rol_principal', 'updated_at']);
        }
    }

    private function syncDimMetric(): void
    {
        $metrics = [
            [
                'id' => 1,
                'nombre' => 'Cobertura Funcional',
                'codigo' => 'CF',
                'tipo' => 'SQA',
                'descripcion' => 'Porcentaje de HUs cubiertas por pruebas de aceptación.',
            ],
            [
                'id' => 2,
                'nombre' => 'Tasa de Exito de Pruebas',
                'codigo' => 'TEP',
                'tipo' => 'SQA',
                'descripcion' => 'Porcentaje de pruebas unitarias y de integración que pasaron exitosamente.',
            ],
            [
                'id' => 3,
                'nombre' => 'Densidad de Defectos',
                'codigo' => 'DD',
                'tipo' => 'SQA',
                'descripcion' => 'Número de defectos encontrados por cada 1000 líneas de código.',
            ],
            [
                'id' => 4,
                'nombre' => 'Vulnerabilidades de Codigo',
                'codigo' => 'VCO',
                'tipo' => 'Seguridad',
                'descripcion' => 'Vulnerabilidades detectadas mediante composer audit o npm audit.',
            ],
        ];

        $records = [];
        foreach ($metrics as $m) {
            $records[] = array_merge($m, [
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        DB::table('metrics.dim_metric')->upsert($records, ['id'], ['nombre', 'codigo', 'tipo', 'descripcion', 'updated_at']);
    }
}
