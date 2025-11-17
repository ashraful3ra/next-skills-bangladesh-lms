<?php

namespace App\Enums;

enum CourseVisibilityType: string
{
    case PUBLIC = 'public';
    case PRIVATE = 'private';

    public function getLabel(): string
    {
        return match ($this) {
            self::PUBLIC => 'Public',
            self::PRIVATE => 'Private',
        };
    }
}
