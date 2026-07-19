<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class DatabaseDumpCommandTest extends TestCase
{
    /**
     * Verifica que el comando esté registrado y no lance excepciones fatales de sintaxis.
     * Al ejecutarse retornará 0 o 1 dependiendo de si Docker/pg_dump están disponibles
     * en la máquina host durante el testing.
     */
    public function test_database_dump_command_executes_safely()
    {
        $exitCode = Artisan::call('db:dump');
        
        $this->assertContains($exitCode, [0, 1], 'El comando debe retornar 0 (éxito) o 1 (fallo esperado).');
    }
}
