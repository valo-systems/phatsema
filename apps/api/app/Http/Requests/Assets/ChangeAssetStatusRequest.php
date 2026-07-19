<?php

declare(strict_types=1);

namespace App\Http\Requests\Assets;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ChangeAssetStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'version' => ['required', 'integer', 'min:1'],
            'status' => ['required', Rule::in([
                'available',
                'assigned',
                'on_hire',
                'in_maintenance',
                'out_of_service',
                'retired',
            ])],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
