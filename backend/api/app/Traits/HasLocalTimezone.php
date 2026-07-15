<?php

namespace App\Traits;

use App\Services\TimezoneService;
use DateTimeInterface;

trait HasLocalTimezone
{
    /**
     * Prepare a date for array / JSON serialization.
     *
     * @param  \DateTimeInterface  $date
     * @return string
     */
    protected function serializeDate(DateTimeInterface $date)
    {
        return TimezoneService::serialize($date);
    }
}
