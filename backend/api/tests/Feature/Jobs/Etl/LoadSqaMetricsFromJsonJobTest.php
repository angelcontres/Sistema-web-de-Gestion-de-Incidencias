<?php

namespace Tests\Feature\Jobs\Etl;

use App\Jobs\Etl\LoadSqaMetricsFromJsonJob;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class LoadSqaMetricsFromJsonJobTest extends TestCase
{
    public function test_calls_artisan_commands()
    {
        Artisan::shouldReceive('call')
            ->once()
            ->with('sqa:vco');
        
        Artisan::shouldReceive('call')
            ->once()
            ->with('sqa:dd');
            
        Artisan::shouldReceive('call')
            ->once()
            ->with('sqa:cf');
            
        Artisan::shouldReceive('call')
            ->once()
            ->with('sqa:tep');

        $job = new LoadSqaMetricsFromJsonJob();
        $job->handle();
    }
}
