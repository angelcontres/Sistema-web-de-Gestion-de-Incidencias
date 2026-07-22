<?php

namespace App\Providers;

use App\Services\Contracts\PermissionServiceInterface;
use App\Services\Contracts\RoleServiceInterface;
use App\Services\PermissionService;
use App\Services\RoleService;
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
        if (app()->environment('testing') && \Illuminate\Support\Facades\DB::connection()->getDriverName() === 'sqlite') {
            \Illuminate\Support\Facades\DB::statement("ATTACH DATABASE ':memory:' AS metrics");
        }
    }
}
