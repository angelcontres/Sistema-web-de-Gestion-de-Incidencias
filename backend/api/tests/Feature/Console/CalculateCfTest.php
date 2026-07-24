<?php

namespace Tests\Feature\Console;

use \Illuminate\Support\Facades\Artisan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CalculateCfTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Artisan::call('migrate', ['--path' => 'database/migrations/olap']);
    }

    public function test_calculate_cf_command_success()
    {
        // El test lee historias_usuario.md del workspace que ya existe
        // y nuestro results_dummy.xml. Como no habrá tests mapeados en results_dummy que tengan @group HU-01,
        // la cobertura será 0, pero el script terminará con éxito.
        $this->artisan('sqa:cf', ['--xml' => 'tests/results_dummy.xml'])
             ->assertExitCode(0);

        $this->assertDatabaseHas('metrics.dim_metric', [
            'codigo' => 'CF'
        ]);

        $this->assertDatabaseCount('metrics.fact_quality', 1);
    }

    public function test_calculate_cf_command_invalid_xml()
    {
        $this->artisan('sqa:cf', ['--xml' => 'invalid/file.xml'])
             ->assertExitCode(1);
    }
}
