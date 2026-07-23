<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * GET /v1/notificaciones
     * Devuelve las notificaciones del operador (leídas y no leídas)
     * y el contador exacto para el badge rojo del Centro de Mando.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $unreadCount = $user->unreadNotifications()->count();
        $notifications = $user->notifications()->latest()->take(15)->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'unread_count' => $unreadCount,
                'notifications' => $notifications->map(function ($notif) {
                    return [
                        'id' => $notif->id,
                        'title' => $notif->data['title'] ?? 'Notificación',
                        'message' => $notif->data['message'] ?? '',
                        'url' => $notif->data['url'] ?? null,
                        'type' => $notif->data['type'] ?? 'info',
                        'is_read' => $notif->read_at !== null,
                        'created_at' => $notif->created_at->diffForHumans(), // Ej: "hace 5 minutos"
                    ];
                }),
            ],
        ]);
    }

    /**
     * PUT /v1/notificaciones/{id}/leer
     * Marca una incidencia específica como leída al hacer clic en ella.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json([
            'status' => 'success',
            'message' => 'Alerta marcada como leída.',
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * PUT /v1/notificaciones/leer-todas
     * Limpia el contador del badge marcando todas las alertas pendientes como leídas.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'status' => 'success',
            'message' => 'Todas las notificaciones han sido marcadas como leídas.',
            'unread_count' => 0,
        ]);
    }
}
