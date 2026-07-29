<?php

namespace Tests\Feature\Console;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CalculateVcoTest extends TestCase
{
    use RefreshDatabase;

    public function test_calculate_vco_command_success()
    {
        $this->artisan('sqa:vco', ['--path' => 'tests'])
            ->assertExitCode(0);
    }

    public function test_calculate_vco_command_invalid_path()
    {
        $this->artisan('sqa:vco', ['--path' => 'invalid/path/that/does/not/exist'])
            ->assertExitCode(1);
    }
}
