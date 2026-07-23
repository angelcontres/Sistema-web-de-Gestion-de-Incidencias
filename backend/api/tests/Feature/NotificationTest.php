<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/v1/notificaciones';
    private const ATTR_TITLE = 'title';

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = $this->createAdminUser();
        Sanctum::actingAs($this->user);
    }

    public function test_index_returns_notifications()
    {
        $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\Notifications\IncidenciaAlert',
            'data' => [
                self::ATTR_TITLE => 'TestTitle',
                'message' => 'Msg',
                'url' => '/link',
                'type' => 'info'
            ],
            'read_at' => null,
        ]);

        $response = $this->getJson(self::ENDPOINT);
        $response->assertStatus(200);
        $response->assertJsonFragment(['unread_count' => 1]);
        $response->assertJsonFragment([self::ATTR_TITLE => 'TestTitle']);
    }

    public function test_mark_as_read_updates_status()
    {
        $notif = $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\Notifications\IncidenciaAlert',
            'data' => [self::ATTR_TITLE => 'TestTitle'],
            'read_at' => null,
        ]);

        $response = $this->putJson(self::ENDPOINT . '/' . $notif->id . '/leer');
        $response->assertStatus(200);
        
        $this->assertNotNull($notif->fresh()->read_at);
        $response->assertJsonFragment(['unread_count' => 0]);
    }

    public function test_mark_all_as_read_updates_all_statuses()
    {
        $this->user->notifications()->create([
            'id' => Str::uuid(),
            'type' => 'App\Notifications\IncidenciaAlert',
            'data' => [self::ATTR_TITLE => 'TestTitle'],
            'read_at' => null,
        ]);

        $response = $this->putJson(self::ENDPOINT . '/leer-todas');
        $response->assertStatus(200);
        
        $this->assertEquals(0, $this->user->unreadNotifications()->count());
    }
}
