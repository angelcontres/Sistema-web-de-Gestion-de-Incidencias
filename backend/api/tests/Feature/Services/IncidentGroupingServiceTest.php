<?php

namespace Tests\Feature\Services;

use App\Models\Direccion;
use App\Models\Incidencia;
use App\Models\Pais;
use App\Models\Territorio;
use App\Services\IncidentGroupingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class IncidentGroupingServiceTest extends TestCase
{

    const string DETAIL_ADDRESS_NAME = 'Calle T';

    use RefreshDatabase;

    private $territorio;

    protected function setUp(): void
    {
        parent::setUp();
        $pais = Pais::create(['nombre' => 'Pais T', 'codigo_iso' => 'PT']);
        $this->territorio = Territorio::create(['pais_id' => $pais->id, 'nombre' => 'Lima', 'tipo' => 'Departamento']);
        // Mock to bypass fixed IDs check if possible, or just insert explicitly
        DB::table('estados_incidencia')->insertOrIgnore([
            ['id' => 1, 'nombre' => 'Pendiente'],
            ['id' => 2, 'nombre' => 'En Revisión'],
            ['id' => 3, 'nombre' => 'En Proceso'],
            ['id' => 4, 'nombre' => 'Completado']
        ]);

        DB::table('categorias_incidencia')->insertOrIgnore([
            ['id' => 1, 'nombre' => 'Cat 1', 'parent_id' => null],
            ['id' => 2, 'nombre' => 'Cat 2', 'parent_id' => 1],
            ['id' => 3, 'nombre' => 'Cat 3', 'parent_id' => 1],
            ['id' => 4, 'nombre' => 'Cat 4', 'parent_id' => null]
        ]);
    }

    public function test_find_similar_incident_within_radius()
    {
        DB::table('reporte_incidencias')->delete();
        DB::table('direcciones')->delete();

        $direccion1 = Direccion::create([
            'territorio_id' => $this->territorio->id,
            'detalle' => self::DETAIL_ADDRESS_NAME,
            'latitud' => -12.046374,
            'longitud' => -77.031250,
        ]);

        $incidencia = Incidencia::create([
            'tipo_incidencia_id' => 1,
            'sub_tipo_incidencia_id' => 2,
            'estado_id' => 1,
            'direccion_id' => $direccion1->id,
            'descripcion' => 'Desc'
        ]);

        $service = new IncidentGroupingService();
        $similar = $service->findSimilarIncident(1, 2, -12.046374, -77.031250);

        $this->assertNotNull($similar);
        $this->assertEquals($incidencia->id, $similar->id);
    }

    public function test_does_not_find_incident_outside_radius()
    {
        DB::table('reporte_incidencias')->delete();
        DB::table('direcciones')->delete();

        $direccion1 = Direccion::create([
            'territorio_id' => $this->territorio->id,
            'detalle' => self::DETAIL_ADDRESS_NAME,
            'latitud' => -12.046374,
            'longitud' => -77.031250,
        ]);

        Incidencia::create([
            'tipo_incidencia_id' => 1,
            'sub_tipo_incidencia_id' => 2,
            'estado_id' => 1,
            'direccion_id' => $direccion1->id,
            'descripcion' => 'Desc'
        ]);

        $service = new IncidentGroupingService();
        $similar = $service->findSimilarIncident(1, 2, -12.047500, -77.031250);

        $this->assertNull($similar);
    }

    public function test_does_not_find_if_different_type_or_subtype()
    {
        DB::table('reporte_incidencias')->delete();
        DB::table('direcciones')->delete();

        $direccion1 = Direccion::create([
            'territorio_id' => $this->territorio->id,
            'detalle' => self::DETAIL_ADDRESS_NAME,
            'latitud' => -12.046374,
            'longitud' => -77.031250,
        ]);

        Incidencia::create([
            'tipo_incidencia_id' => 1,
            'sub_tipo_incidencia_id' => 2,
            'estado_id' => 1,
            'direccion_id' => $direccion1->id,
            'descripcion' => 'Desc'
        ]);

        $service = new IncidentGroupingService();
        $similar = $service->findSimilarIncident(1, 3, -12.046374, -77.031250);
        $this->assertNull($similar);

        $similar2 = $service->findSimilarIncident(4, 4, -12.046374, -77.031250);
        $this->assertNull($similar2);
    }

    public function test_does_not_find_if_invalid_state()
    {
        DB::table('reporte_incidencias')->delete();
        DB::table('direcciones')->delete();

        $direccion1 = Direccion::create([
            'territorio_id' => $this->territorio->id,
            'detalle' => self::DETAIL_ADDRESS_NAME,
            'latitud' => -12.046374,
            'longitud' => -77.031250,
        ]);

        Incidencia::create([
            'tipo_incidencia_id' => 1,
            'sub_tipo_incidencia_id' => 2,
            'estado_id' => 4,
            'direccion_id' => $direccion1->id,
            'descripcion' => 'Desc'
        ]);

        $service = new IncidentGroupingService();
        $similar = $service->findSimilarIncident(1, 2, -12.046374, -77.031250);

        $this->assertNull($similar);
    }
}
