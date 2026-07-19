<?php

declare(strict_types=1);

namespace App\Http\Support;

use Illuminate\Http\JsonResponse;
use Symfony\Component\Uid\Ulid;

final class ProblemDetails
{
    /** @param array<string, list<string>> $errors */
    public static function response(
        string $type,
        string $title,
        int $status,
        string $detail,
        array $errors = [],
    ): JsonResponse {
        $body = [
            'type' => "https://portal.phatsema.example/problems/{$type}",
            'title' => $title,
            'status' => $status,
            'detail' => $detail,
            'traceId' => (string) new Ulid,
        ];

        if ($errors !== []) {
            $body['errors'] = $errors;
        }

        return response()->json(
            $body,
            $status,
            ['Content-Type' => 'application/problem+json'],
        );
    }
}
