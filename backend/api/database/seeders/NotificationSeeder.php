<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Notifications\IssueAssignedNotification;
use App\Notifications\IssueStatusChangedNotification;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        config(['queue.default' => 'sync']);
        config(['broadcasting.default' => 'null']);
        // 1. TRUCO DE MAGIA: Forzar que las alertas se guarden al instante en la BD (evita que se vayan a la cola)
        config(['queue.default' => 'sync']);

        // 2. Obtener TODOS los usuarios que ya fueron creados previamente en DatabaseSeeder
        $usuarios = User::all();

        if ($usuarios->isEmpty()) {
            $usuarios = collect([
                User::factory()->create([
                    'name' => 'Operador de Centro de Mando',
                    'email' => 'operador@emergencias.gob',
                ])
            ]);
        }

        foreach ($usuarios as $user) {
            // Limpiar alertas previas de este usuario para no acumular duplicados
            $user->notifications()->delete();

            // --- INCIDENCIAS ASIGNADAS (Sin leer) ---
            $user->notify(new IssueAssignedNotification([
                'title' => 'Despacho Urgente: Robo en Progreso',
                'message' => 'Incidencia #104 (Robo a local comercial en Av. Principal) asignada a: Policía Nacional - Patrulla 12.',
                'url' => '/v1/incidencias/104',
                'type' => 'danger' 
            ]));

            $user->notify(new IssueAssignedNotification([
                'title' => 'Nueva Asignación: Accidente Vehicular',
                'message' => 'Incidencia #108 (Choque múltiple con atrapados) asignada a: Cuerpo de Bomberos y Ambulancia Cruz Roja.',
                'url' => '/v1/incidencias/108',
                'type' => 'warning' 
            ]));

            $user->notify(new IssueAssignedNotification([
                'title' => 'Asignación de Rutina',
                'message' => 'Incidencia #110 (Árbol caído en vía pública) asignada a: Protección Civil.',
                'url' => '/v1/incidencias/110',
                'type' => 'info' 
            ]));

            // --- CAMBIOS DE ESTADO ---
            $user->notify(new IssueStatusChangedNotification([
                'title' => 'Actualización de Incidencia',
                'message' => 'La incidencia #98 (Incendio estructural en zona industrial) cambió su estado a: Controlado / En Enfriamiento.',
                'url' => '/v1/incidencias/98',
                'type' => 'info'
            ]));

            $user->notify(new IssueStatusChangedNotification([
                'title' => 'Incidencia Resuelta',
                'message' => 'La incidencia #85 (Asalto a transeúnte) cambió su estado a: Cerrada / Sospechoso Detenido por Policía Municipal.',
                'url' => '/v1/incidencias/85',
                'type' => 'success' 
            ]));

            $user->notify(new IssueStatusChangedNotification([
                'title' => 'Incidencia Cancelada',
                'message' => 'La incidencia #80 (Falsa alarma de fuga de gas) cambió su estado a: Anulada por Bomberos.',
                'url' => '/v1/incidencias/80',
                'type' => 'secondary'
            ]));

            // Marcar formalmente las 2 últimas como leídas en la base de datos
            $user->notifications()->take(2)->get()->each(function ($notificacion) {
                $notificacion->markAsRead();
            });
        }

        $totalUsuarios = $usuarios->count();
        $this->command->info("¡Seeder de incidencias ejecutado con éxito para {$totalUsuarios} usuario(s)!");
        $this->command->info("-> Cada usuario recibió: 4 alertas sin leer (rojas/amarillas/azules) y 2 leídas (grises).");
    }
}