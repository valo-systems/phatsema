<?php

declare(strict_types=1);

namespace App\Http\Requests\Identity;

use Illuminate\Foundation\Http\FormRequest;

final class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'currentPassword' => ['required', 'string', 'max:100'],
            'newPassword' => ['required', 'string', 'min:12', 'max:100', 'different:currentPassword'],
            'newPasswordConfirmation' => ['required', 'string', 'same:newPassword'],
        ];
    }
}
