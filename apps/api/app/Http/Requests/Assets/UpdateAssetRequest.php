<?php

declare(strict_types=1);

namespace App\Http\Requests\Assets;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateAssetRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:160'],
            'registrationNumber' => ['nullable', 'string', 'max:20'],
            'nextServiceAt' => ['nullable', 'date'],
            'nextServiceMeter' => ['nullable', 'decimal:0,3', 'gte:0'],
        ];
    }
}
