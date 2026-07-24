<?php

namespace Tests\Feature\Http\Controllers;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

class MetricsControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Create test metrics directories if they don't exist
        $dirs = ['tep', 'cf', 'dd', 'vco', 'trp'];
        foreach ($dirs as $dir) {
            $path = base_path('tests/metrics-stg/' . $dir);
            if (!File::exists($path)) {
                File::makeDirectory($path, 0755, true);
            }
        }
    }

    protected function tearDown(): void
    {
        $dirs = ['tep', 'cf', 'dd', 'vco', 'trp'];
        foreach ($dirs as $dir) {
            $path = base_path('tests/metrics-stg/' . $dir);
            File::cleanDirectory($path);
        }
        parent::tearDown();
    }

    public function test_tep_returns_all_metrics()
    {
        $assertDate = '2023-01-01';

        $dir = base_path('tests/metrics-stg/tep');
        File::put($dir . '/tep-2023-01-01.json', json_encode(['fecha_procesamiento' => '2023-01-01', 'value' => 1]));
        File::put($dir . '/tep-2023-01-02.json', json_encode(['fecha_procesamiento' => '2023-01-02', 'value' => 2]));

        $response = $this->get('/api/v1/metrics/tep');
        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(2, $data);
        $this->assertEquals($assertDate, $data[0]['fecha_procesamiento']);
    }

    public function test_cf_returns_specific_metric()
    {
        $assertDate = '2023-04-04';
        $dir = base_path('tests/metrics-stg/cf');
        File::put($dir . '/cf-2023-04-04.json', json_encode(['fecha_procesamiento' => '2023-04-04', 'value' => 1]));

        $response = $this->get('/api/v1/metrics/cf/' . $assertDate);
        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEquals(1, $data['value']);
    }

    public function test_dd_returns_not_found_for_missing_date()
    {
        $response = $this->get('/api/v1/metrics/dd/2024-01-01');
        $response->assertStatus(404);
        $response->assertJsonFragment(['error' => 'Métrica no encontrada para la fecha: 2024-01-01']);
    }

    public function test_vco_returns_empty_when_no_files()
    {
        $response = $this->get('/api/v1/metrics/vco');
        $response->assertStatus(200);
        $this->assertEmpty($response->json());
    }

    public function test_trp_finds_file_with_partial_date()
    {
        $dir = base_path('tests/metrics-stg/trp');
        File::put($dir . '/trp-2025-05-05T00-00-00.json', json_encode(['fecha_procesamiento' => '2025-05-05', 'value' => 5]));

        $response = $this->get('/api/v1/metrics/trp/2025-05-05');
        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEquals(5, $data['value']);
    }
}
