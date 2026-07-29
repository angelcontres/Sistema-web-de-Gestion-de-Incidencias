<?php

namespace App\Events;

use App\Models\HistorialIncidencia;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class HistorialIncidenciaCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $historial;

    /**
     * Create a new event instance.
     */
    public function __construct(HistorialIncidencia $historial)
    {
        $this->historial = $historial->load(['usuario', 'estado']);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('incidencia.'.$this->historial->incidencia_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'historial.created';
    }

    public function broadcastWith(): array
    {
        return [
            'historial' => $this->historial->toArray(),
        ];
    }
}
