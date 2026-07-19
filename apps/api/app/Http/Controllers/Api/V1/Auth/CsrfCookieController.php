<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;

final class CsrfCookieController extends Controller
{
    public function __invoke(): Response
    {
        return response()->noContent();
    }
}
