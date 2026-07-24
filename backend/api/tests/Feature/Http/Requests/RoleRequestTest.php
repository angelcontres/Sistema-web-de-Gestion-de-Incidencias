<?php

namespace Tests\Feature\Http\Requests;

use App\Http\Requests\RoleRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class RoleRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_authorize_returns_true()
    {
        $request = new RoleRequest();
        $this->assertTrue($request->authorize());
    }

    public function test_rules_for_standard_role_creation()
    {
        $request = \Mockery::mock(RoleRequest::class)->makePartial();
        $request->shouldReceive('path')->andReturn('api/v1/roles');

        $rules = $request->rules();

        $this->assertEquals([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'required|string|max:255',
            'padre_id' => 'nullable|integer|exists:roles,id',
        ], $rules);
    }

    public function test_rules_for_assigning_permissions()
    {
        $request = \Mockery::mock(RoleRequest::class)->makePartial();
        $request->shouldReceive('path')->andReturn('api/v1/roles/1/permisos');

        $rules = $request->rules();

        $this->assertEquals([
            'permisos' => 'array',
            'permisos.*' => 'integer|exists:permisos,id',
        ], $rules);
    }
    
    public function test_rules_for_assigning_permissions_english_path()
    {
        $request = \Mockery::mock(RoleRequest::class)->makePartial();
        $request->shouldReceive('path')->andReturn('api/v1/roles/1/permissions');

        $rules = $request->rules();

        $this->assertEquals([
            'permisos' => 'array',
            'permisos.*' => 'integer|exists:permisos,id',
        ], $rules);
    }
}
