<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Demo\ResetDemoService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class DemoController extends Controller
{
    public function __construct(private readonly ResetDemoService $demo) {}

    public function reset(): JsonResponse
    {
        $this->demo->reset();

        return response()->json([
            'data' => ['message' => 'Demo data has been reset to factory defaults.'],
        ]);
    }
}
