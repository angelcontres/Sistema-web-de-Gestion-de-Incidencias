<?php

namespace Tests\Feature\Console;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CalculateCfTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Limpiar mock si lo hay
        File::clearResolvedInstances();
    }

    public function test_calculate_cf_command_success()
    {
        // Usa el archivo real o un dummy real en el workspace
        $this->artisan('sqa:cf', ['--xml' => 'tests/results_dummy.xml'])
            ->assertExitCode(0);

        $this->assertDatabaseHas('metrics.dim_metric', [
            'codigo' => 'CF',
        ]);

        $this->assertDatabaseCount('metrics.fact_quality', 1);
    }

    public function test_calculate_cf_command_invalid_xml()
    {
        $this->artisan('sqa:cf', ['--xml' => 'invalid/file.xml'])
            ->assertExitCode(1);
    }

    public function test_calculate_cf_missing_markdown()
    {
        File::shouldReceive('exists')
            ->with(base_path('../../docs/01_analisis/historias_usuario.md'))
            ->andReturn(false);
            
        $this->artisan('sqa:cf', ['--xml' => 'tests/results_dummy.xml'])
            ->expectsOutput('No se encontraron Historias de Usuario en el archivo docs/01_analisis/historias_usuario.md')
            ->assertExitCode(1);
    }

    public function test_calculate_cf_with_tests_and_results()
    {
        // Limpiamos los mocks de File para poder crear archivos reales temporalmente
        File::clearResolvedInstances();

        // 1. Crear markdown temporal
        $mdPath = base_path('../../docs/01_analisis');
        if (!File::exists($mdPath)) {
            File::makeDirectory($mdPath, 0755, true);
        }
        $mdFile = $mdPath . '/historias_usuario.md';
        $originalMd = File::exists($mdFile) ? File::get($mdFile) : null;
        File::put($mdFile, "## HU-9991: Login\n## HU-9992: Registro\n## HU-9993: Consulta");

        // 2. Crear XML report temporal
        $xmlPath = base_path('tests/dummy_report.xml');
        $xmlContent = '<?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
            <testsuite>
                <testcase name="test_metodo_1"/>
                <testcase name="test_metodo_2">
                    <failure>Falló</failure>
                </testcase>
                <testcase name="test_metodo_3"/>
            </testsuite>
        </testsuites>';
        File::put($xmlPath, $xmlContent);

        // 3. Crear test file temporal con anotaciones @group HU-XX
        $testFilePath = base_path('tests/Feature/DummyHuTest.php');
        $testContent = '<?php
        class DummyHuTest {
            /** @group HU-9991 */
            public function test_metodo_1() {}
            /** @group HU-9992 */
            public function test_metodo_2() {}
            /** @group HU-9993 */
            public function test_metodo_3() {}
        }';
        File::put($testFilePath, $testContent);

        // Ejecutar comando
        $this->artisan('sqa:cf', ['--xml' => 'tests/dummy_report.xml'])
            ->assertExitCode(0);

        // Verificar DB (2 cubiertas y aprobadas de 3 = 66.67%)
        $this->assertDatabaseHas('metrics.fact_quality', [
            'valor_porcentaje' => 66.67
        ]);

        // Cleanup
        File::delete($xmlPath);
        File::delete($testFilePath);
        if ($originalMd !== null) {
            File::put($mdFile, $originalMd);
        } else {
            File::delete($mdFile);
        }
    }
}
