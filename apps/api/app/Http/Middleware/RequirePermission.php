<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Http\Support\ProblemDetails;
use App\Policies\PermissionPolicy;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RequirePermission
{
    public function __construct(private readonly PermissionPolicy $policy) {}

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (! $request->session()->has('auth_user_id')) {
            return ProblemDetails::response(
                'unauthenticated',
                'Unauthenticated',
                401,
                'You must be authenticated to access this resource.',
            );
        }

        $siteId = $request->input('siteId');
        if (! is_string($siteId)) {
            $siteId = null;
        }

        if (! $this->policy->allows($permission, $siteId)) {
            return ProblemDetails::response(
                'forbidden',
                'Forbidden',
                403,
                "You do not have the '{$permission}' permission for this resource.",
            );
        }

        return $next($request);
    }
}
