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

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \App\Models\Incidencia::observe(\App\Observers\IncidenciaObserver::class);
    }
}
