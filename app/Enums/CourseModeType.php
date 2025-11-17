<?php

namespace App\Enums;

enum CourseModeType: string
{
    case MAIN = 'main';
    case BATCH = 'batch';

    public function getLabel(): string
    {
        return match ($this) {
            self::MAIN => 'Main course',
            self::BATCH => 'Batch course',
        };
    }
}
