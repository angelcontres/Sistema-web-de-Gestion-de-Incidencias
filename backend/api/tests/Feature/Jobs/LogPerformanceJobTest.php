<?php

namespace Tests\Feature\Jobs;

use App\Jobs\LogPerformanceJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogPerformanceJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_log_performance_job_creates_record()
    {
        $user = User::factory()->create();

        $data = [
            'endpoint' => '/api/test',
            'metodo' => 'GET',
            'trp' => 120,
            'usuario_id' => $user->id,
            'logged_at' => now(),
        ];

        $job = new LogPerformanceJob($data);
        $job->handle();

        $this->assertDatabaseHas('performance_logs', [
            'endpoint' => '/api/test',
            'metodo' => 'GET',
            'trp' => 120,
        ]);
    }
}
