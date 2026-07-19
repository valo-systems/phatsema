<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class LogoutController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $request->session()->forget('auth_user_id');
        $request->session()->regenerate(true);
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
