<?php

namespace App\Jobs;

use App\Models\PerformanceLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class LogPerformanceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $performanceData;

    /**
     * Create a new job instance.
     */
    public function __construct(array $performanceData)
    {
        $this->performanceData = $performanceData;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        PerformanceLog::create($this->performanceData);
    }
}
