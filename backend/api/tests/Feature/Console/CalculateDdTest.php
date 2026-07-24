<?php

namespace Tests\Feature\Console;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CalculateDdTest extends TestCase
{
    use RefreshDatabase;

    public function test_calculate_dd_command_success()
    {
        // El comando usa cloc y git, los cuales están disponibles.
        // Va a calcular y guardar la métrica en la BD.
        $this->artisan('sqa:dd')
            ->assertExitCode(0);

        $this->assertDatabaseHas('metrics.dim_metric', [
            'codigo' => 'DD',
        ]);

        $this->assertDatabaseCount('metrics.fact_quality', 1);
    }

    public function test_calculate_dd_command_invalid_path()
    {
        $this->artisan('sqa:dd', ['--path' => 'invalid/path/that/does/not/exist'])
            ->expectsOutput('La ruta especificada (invalid/path/that/does/not/exist) no es válida o no existe.')
            ->assertExitCode(1);
    }
}
