<?php

declare(strict_types=1);

use App\Application\Exceptions\ProblemException;
use App\Http\Middleware\RequireAuth;
use App\Http\Middleware\RequirePermission;
use App\Http\Support\ProblemDetails;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Exempt these endpoints from CSRF verification
        $middleware->validateCsrfTokens(except: [
            'api/v1/csrf-cookie',
            'api/v1/health',
            'api/v1/auth/login',
        ]);

        $middleware->alias([
            'auth.demo' => RequireAuth::class,
            'perm' => RequirePermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->render(function (ProblemException $exception, Request $request) {
            if ($request->is('api/*')) {
                return ProblemDetails::response(
                    $exception->problemType,
                    $exception->problemTitle,
                    $exception->status,
                    $exception->getMessage(),
                    $exception->errors,
                );
            }
        });

        // Render CSRF token mismatch as Problem Details
        $exceptions->render(function (TokenMismatchException $e, Request $request) {
            if ($request->is('api/*')) {
                return ProblemDetails::response(
                    'csrf-token-mismatch',
                    'CSRF Token Mismatch',
                    419,
                    'The CSRF token is missing or invalid. Fetch /api/v1/csrf-cookie and retry with the X-XSRF-TOKEN header.',
                );
            }
        });

        // Render validation errors as Problem Details
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return ProblemDetails::response(
                    'validation',
                    'Validation Error',
                    422,
                    'One or more fields failed validation.',
                    $e->errors(),
                );
            }
        });

        // Render 404s as Problem Details
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return ProblemDetails::response(
                    'not-found',
                    'Not Found',
                    404,
                    'The requested endpoint does not exist.',
                );
            }
        });
    })->create();
