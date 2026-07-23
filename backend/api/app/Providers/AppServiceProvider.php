<?php

namespace App\Providers;

use App\Services\Contracts\PermissionServiceInterface;
use App\Services\Contracts\RoleServiceInterface;
use App\Services\PermissionService;
use App\Services\RoleService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            RoleServiceInterface::class,
            RoleService::class
        );
        $this->app->bind(
            PermissionServiceInterface::class,
            PermissionService::class
        );
    }

    public function boot(): void
    {
        if (app()->environment('testing') && DB::connection()->getDriverName() === 'sqlite') {
            DB::statement("ATTACH DATABASE ':memory:' AS metrics");
        }
    }
}
