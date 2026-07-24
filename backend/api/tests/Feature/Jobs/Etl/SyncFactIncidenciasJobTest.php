<?php

namespace Tests\Feature\Jobs\Etl;

use App\Jobs\Etl\SyncDimensionsJob;
use App\Jobs\Etl\SyncFactIncidenciasJob;
use App\Models\Direccion;
use App\Models\Pais;
use App\Models\Prioridad;
use App\Models\Territorio;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SyncFactIncidenciasJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_syncs_incidencias_and_calculates_times()
    {
        DB::table('reporte_incidencias')->delete();
        DB::table('metrics.fact_incidencias')->delete();
        DB::table('metrics.dim_tiempo')->delete();

        $pais = Pais::create(['nombre' => 'Pais T', 'codigo_iso' => 'PT']);
        $territorio = Territorio::create(['pais_id' => $pais->id, 'nombre' => 'Lima', 'tipo' => 'Departamento']);
        $direccion = Direccion::create(['territorio_id' => $territorio->id, 'detalle' => 'Calle T', 'codigo_postal' => '15001']);

        DB::table('estados_incidencia')->insertOrIgnore([
            ['id' => 1, 'nombre' => 'Pendiente'],
            ['id' => 3, 'nombre' => 'En Proceso'],
            ['id' => 4, 'nombre' => 'Completado'],
        ]);

        DB::table('categorias_incidencia')->insertOrIgnore([
            ['id' => 1, 'nombre' => 'Cat 1', 'parent_id' => null],
            ['id' => 2, 'nombre' => 'Cat 2', 'parent_id' => 1],
        ]);

        Prioridad::create(['id' => 1, 'nombre' => 'Alta', 'nivel' => 3, 'color_hex' => '#FF0000', 'tiempo_respuesta_esperado' => 10, 'tiempo_resolucion_esperado' => 30]);

        $createdAt = Carbon::now()->subHours(2);

        $incidenciaId = DB::table('reporte_incidencias')->insertGetId([
            'direccion_id' => $direccion->id,
            'tipo_incidencia_id' => 1,
            'sub_tipo_incidencia_id' => 2,
            'estado_id' => 4,
            'prioridad_id' => 1,
            'cliente_id' => User::factory()->create()->id,
            'incidencia_descripcion' => 'Desc',
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);

        // Mock history for time calculation
        DB::table('historial_incidencias')->insert([
            'incidencia_id' => $incidenciaId,
            'estado_id' => 3, // En Proceso
            'created_at' => $createdAt->copy()->addMinutes(15),
            'updated_at' => $createdAt->copy()->addMinutes(15),
            'usuario_id' => User::factory()->create()->id,
        ]);

        DB::table('historial_incidencias')->insert([
            'incidencia_id' => $incidenciaId,
            'estado_id' => 4, // Resuelto
            'created_at' => $createdAt->copy()->addMinutes(45),
            'updated_at' => $createdAt->copy()->addMinutes(45),
            'usuario_id' => User::factory()->create()->id,
        ]);

        $dimensionJob = new SyncDimensionsJob;
        $dimensionJob->handle();

        $job = new SyncFactIncidenciasJob;
        $job->handle();

        $this->assertDatabaseHas('metrics.fact_incidencias', [
            'id' => $incidenciaId,
            'territorio_id' => $territorio->id,
            'categoria_id' => 1,
            'codigo_postal' => '15001',
            'tiempo_respuesta_minutos' => 15,
            'tiempo_resolucion_minutos' => 45,
        ]);
    }
}
