<?php

namespace Tests\Feature\Console;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class CalculateTepTest extends TestCase
{
    use RefreshDatabase;


    public function test_calculate_tep_command_success()
    {
        $this->artisan('sqa:tep', ['--file' => 'tests/results_dummy.xml'])
            ->assertExitCode(0);

        $this->assertDatabaseHas('metrics.fact_testing', [
            'total_pruebas' => 5,
            'pruebas_fallidas' => 1, // 1 failure from dummy
            'pruebas_aprobadas' => 4, // 5 - 1
            'tep' => 80.00,
        ]);
    }

    public function test_calculate_tep_command_invalid_file()
    {
        $this->artisan('sqa:tep', ['--file' => 'invalid/file.xml'])
            ->expectsOutput('No se encontró el reporte XML en: '.base_path('invalid/file.xml').'. Ejecuta primero: php artisan test --log-junit tests/results.xml')
            ->assertExitCode(1);
    }
}
