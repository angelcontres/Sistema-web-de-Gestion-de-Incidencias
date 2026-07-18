<?php

namespace Tests;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Create an admin user or user with specific permissions.
     */
    protected function createAdminUser(array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $adminRole = Role::firstOrCreate(
            ['nombre' => 'Admin'],
            [
                'descripcion' => 'Administrador del sistema',
                'created_by' => $user->id,
            ]
        );
        $user->roles()->sync([$adminRole->id]);

        $this->seed(\Database\Seeders\PermissionsSeeder::class);
        $allPermissionsIds = \App\Models\Permiso::pluck('id')->toArray();
        $adminRole->permisos()->sync($allPermissionsIds);

        return $user;
    }
}
