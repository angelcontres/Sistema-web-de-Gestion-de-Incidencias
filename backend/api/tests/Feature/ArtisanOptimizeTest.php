<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class ArtisanOptimizeTest extends TestCase
{
    public function test_optimize_commands_run_successfully()
    {
        $this->assertEquals(0, Artisan::call('optimize'));
        $this->assertEquals(0, Artisan::call('route:cache'));
        $this->assertEquals(0, Artisan::call('config:cache'));
        $this->assertEquals(0, Artisan::call('view:cache'));
    }
}
