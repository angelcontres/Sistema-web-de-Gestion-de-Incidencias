<?php

namespace App\Services;

use Carbon\Carbon;
use DateTimeInterface;

class TimezoneService
{
    /**
     * Get the default local timezone for the application context.
     * Default to 'America/Guayaquil'.
     */
    public static function timezone(): string
    {
        return config('app.local_timezone', 'America/Guayaquil');
    }

    /**
     * Get the current time in the local timezone.
     */
    public static function nowLocal(): Carbon
    {
        return Carbon::now(self::timezone());
    }

    /**
     * Convert a given date (string or Carbon) to the local timezone.
     * If no timezone is provided in the input, it's assumed to be the system's timezone (UTC).
     */
    public static function toLocal($date): Carbon
    {
        return Carbon::parse($date)->setTimezone(self::timezone());
    }

    /**
     * Format a DateTimeInterface to an ISO-8601 string with the local timezone offset.
     * Useful for JSON serialization in models.
     */
    public static function serialize(DateTimeInterface $date): string
    {
        return Carbon::instance($date)->setTimezone(self::timezone())->toIso8601String();
    }
}
