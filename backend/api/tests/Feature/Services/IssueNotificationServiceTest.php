<?php

namespace Tests\Feature\Services;

use App\Models\EstadoIncidencia;
use App\Models\Incidencia;
use App\Models\Pais;
use App\Models\Territorio;
use App\Models\Direccion;
use App\Models\User;
use \App\Models\Institucion;
use App\Notifications\IssueAssignedNotification;
use App\Notifications\IssueStatusChangedNotification;
use App\Services\IssueNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class IssueNotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        DB::table('estados_incidencia')->insertOrIgnore([
            ['id' => 1, 'nombre' => 'Pendiente'],
            ['id' => 2, 'nombre' => 'En Revisión'],
        ]);

        DB::table('categorias_incidencia')->insertOrIgnore([
            ['id' => 1, 'nombre' => 'Cat 1', 'parent_id' => null],
            ['id' => 2, 'nombre' => 'Cat 2', 'parent_id' => 1],
        ]);
    }

    public function test_notify_status_change()
    {
        Notification::fake();

        $cliente = User::factory()->create();
        $institucion = Institucion::firstOrCreate(['id' => 1], ['nombre' => 'Inst 1', 'siglas' => 'I1']);
        $userInstitucion = User::factory()->create(['institucion_id' => $institucion->id]);

        $oldStatus = EstadoIncidencia::find(1);

        $incidencia = Incidencia::create([
            'cliente_id' => $cliente->id,
            'institucion_id' => $institucion->id,
            'tipo_incidencia_id' => 1,
            'sub_tipo_incidencia_id' => 2,
            'estado_id' => $oldStatus->id,
            'descripcion' => 'Desc'
        ]);

        IssueNotificationService::notifyStatusChange($incidencia, $oldStatus);

        Notification::assertSentTo(
            [$cliente, $userInstitucion],
            IssueStatusChangedNotification::class,
            function ($notification, $channels) use ($incidencia, $cliente) {
                return str_contains($notification->toArray($cliente)['url'], (string)$incidencia->id);
            }
        );
    }

    public function test_notify_assignment()
    {
        Notification::fake();

        $assignedUser = User::factory()->create();

        $pais = Pais::create(['nombre' => 'Pais T', 'codigo_iso' => 'PT']);
        $territorio = Territorio::create(['pais_id' => $pais->id, 'nombre' => 'Lima', 'tipo' => 'Departamento']);
        $direccion = Direccion::create(['territorio_id' => $territorio->id, 'detalle' => 'Calle T']);

        $status = EstadoIncidencia::find(1);

        $incidencia = Incidencia::create([
            'direccion_id' => $direccion->id,
            'tipo_incidencia_id' => 1,
            'sub_tipo_incidencia_id' => 2,
            'estado_id' => $status->id,
            'descripcion' => 'Desc'
        ]);

        IssueNotificationService::notifyAssignment($incidencia, $assignedUser);

        Notification::assertSentTo(
            $assignedUser,
            IssueAssignedNotification::class,
            function ($notification, $channels) use ($incidencia, $assignedUser) {
                return str_contains($notification->toArray($assignedUser)['url'], (string)$incidencia->id);
            }
        );
    }

    public function test_notify_status_change_covers_all_colors()
    {
        Notification::fake();
        $cliente = User::factory()->create();
        $institucion = Institucion::firstOrCreate(['id' => 1], ['nombre' => 'Inst 1', 'siglas' => 'I1']);

        // 1. Creamos estados extras en la DB para forzar los otros caminos del match
        $estadoCritico = EstadoIncidencia::create(['nombre' => 'Crítico']);
        $estadoDesconocido = EstadoIncidencia::create(['nombre' => 'Desconocido']);
        $oldStatus = EstadoIncidencia::find(1); // Pendiente

        $incidencia = Incidencia::create([
            'cliente_id' => $cliente->id,
            'institucion_id' => $institucion->id,
            'tipo_incidencia_id' => 1,
            'sub_tipo_incidencia_id' => 2,
            'estado_id' => $estadoCritico->id, // Forzamos el color 'danger'
            'descripcion' => 'Desc'
        ]);

        // Ejecutamos para el estado Crítico
        IssueNotificationService::notifyStatusChange($incidencia, $oldStatus);

        // Cambiamos el estado a uno desconocido para forzar el 'default -> secondary'
        $incidencia->update(['estado_id' => $estadoDesconocido->id]);
        IssueNotificationService::notifyStatusChange($incidencia, $oldStatus);

        Notification::assertSentTo([$cliente], IssueStatusChangedNotification::class);
    }
}
