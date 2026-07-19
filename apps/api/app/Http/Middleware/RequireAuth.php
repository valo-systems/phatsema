<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Http\Support\ProblemDetails;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RequireAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->has('auth_user_id')) {
            return ProblemDetails::response(
                'unauthenticated',
                'Unauthenticated',
                401,
                'You must be authenticated to access this resource.',
            );
        }

        return $next($request);
    }
}
