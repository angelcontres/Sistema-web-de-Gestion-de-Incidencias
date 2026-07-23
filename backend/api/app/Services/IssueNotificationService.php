<?php

namespace App\Services;

use App\Models\EstadoIncidencia;
use App\Models\ReporteIncidencia;
use App\Models\User;
use App\Notifications\IssueAssignedNotification;
use App\Notifications\IssueStatusChangedNotification;
use Illuminate\Support\Facades\Notification;

class IssueNotificationService
{
    /**
     * Gatillado por [FS-03]: Cuando el estado de una incidencia cambia.
     */
    public static function notifyStatusChange(
        ReporteIncidencia $issue,
        EstadoIncidencia $oldStatus
    ): void {
        // Carga ansiosa para evitar el problema N+1 y asegurar que existan los datos
        $issue->loadMissing(['estado', 'tipoIncidencia', 'prioridad', 'cliente']);

        $newStatusName = $issue->estado->nombre ?? 'Actualizado';
        $tipoNombre = $issue->tipoIncidencia->nombre ?? 'Incidencia';

        $payload = [
            'title' => "Cambio de Estado: {$tipoNombre} #{$issue->id}",
            'message' => "El estado cambió de '{$oldStatus->nombre}' a '{$newStatusName}'.",
            'url' => "/v1/incidencias/{$issue->id}",
            'type' => self::getStatusColor($newStatusName),
            'incidencia_id' => $issue->id,
            'color_hex' => $issue->prioridad->color_hex ?? null,
        ];

        // Lógica real de negocio: Notificar al cliente que reportó y a la institución a cargo
        $destinatarios = collect([$issue->cliente])->filter();

        if ($issue->institucion_id) {
            $usuariosInstitucion = User::where('institucion_id', $issue->institucion_id)->get();
            $destinatarios = $destinatarios->merge($usuariosInstitucion)->unique('id');
        }

        Notification::send($destinatarios, new IssueStatusChangedNotification($payload));
    }

    /**
     * Gatillado por [FS-02]: Cuando se asigna un usuario o responsable.
     */
    public static function notifyAssignment(ReporteIncidencia $issue, User $assignedUser): void
    {
        $issue->loadMissing(['tipoIncidencia', 'prioridad', 'direccion']);

        $tipoNombre = $issue->tipoIncidencia->nombre ?? 'Incidencia';
        // En tu BD no hay title, pero sí una dirección física real:
        $ubicacion = $issue->direccion->detalle ?? 'Ubicación no registrada';

        $payload = [
            'title' => "Nueva Asignación: {$tipoNombre} #{$issue->id}",
            'message' => "Se te ha asignado atención en: {$ubicacion}.",
            'url' => "/v1/incidencias/{$issue->id}",
            'type' => 'warning',
            'incidencia_id' => $issue->id,
            'color_hex' => $issue->prioridad->color_hex ?? '#f59e0b',
        ];

        $assignedUser->notify(new IssueAssignedNotification($payload));
    }

    private static function getStatusColor(string $status): string
    {
        return match (strtolower($status)) {
            'resuelto', 'cerrado', 'controlado' => 'success',
            'en progreso', 'atendiendo', 'en ruta' => 'info',
            'crítico', 'urgente', 'pendiente' => 'danger',
            default => 'secondary',
        };
    }
}
