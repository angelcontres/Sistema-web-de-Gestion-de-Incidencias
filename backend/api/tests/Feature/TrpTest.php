<?php

namespace Tests\Feature;

use App\Models\PerformanceLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TrpTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT_BASE = '/api/v1/trp/';
    private const ATTR_TRP = 'trp';
    private const ATTR_ENDPOINT = 'endpoint';
    private const ATTR_METODO = 'metodo';

    protected function setUp(): void
    {
        parent::setUp();
        $admin = $this->createAdminUser();
        Sanctum::actingAs($admin);
    }

    public function test_performance_stats_returns_data()
    {
        PerformanceLog::create([
            self::ATTR_TRP => 150,
            self::ATTR_ENDPOINT => '/api/test',
            self::ATTR_METODO => 'GET',
            'user_agent' => 'Test',
            'logged_at' => now(),
        ]);

        $response = $this->getJson(self::ENDPOINT_BASE . 'performance-stats');
        $response->assertStatus(200);
        $response->assertJsonStructure(['timeline', 'top_slowest']);
    }

    public function test_export_logs_returns_csv()
    {
        PerformanceLog::create([
            self::ATTR_TRP => 120,
            self::ATTR_ENDPOINT => '/api/test',
            self::ATTR_METODO => 'POST',
            'user_agent' => 'Test',
            'logged_at' => now(),
        ]);

        $response = $this->get(self::ENDPOINT_BASE . 'performance-logs/export');
        $response->assertStatus(200);
        $this->assertStringContainsString('120', $response->streamedContent());
    }
}
