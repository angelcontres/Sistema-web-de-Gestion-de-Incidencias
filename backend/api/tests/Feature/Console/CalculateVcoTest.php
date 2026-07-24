<?php

namespace Tests\Feature\Console;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class CalculateVcoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Artisan::call('migrate', ['--path' => 'database/migrations/olap']);
    }

    public function test_calculate_vco_command_success()
    {
        // Esto ejecutará "composer audit" que debería existir.
        // Y escaneará el frontend si existe.
        $this->artisan('sqa:vco')
            ->assertExitCode(0);
    }

    public function test_calculate_vco_command_invalid_path()
    {
        $this->artisan('sqa:vco', ['--path' => 'invalid/path/that/does/not/exist'])
            ->assertExitCode(1);
    }
}
