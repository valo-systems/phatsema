<?php

declare(strict_types=1);

namespace App\Http\Requests\Transfers;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateTransferRequest extends FormRequest
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
            'notes' => ['nullable', 'string', 'max:1000'],
            'sourceLocationId' => ['sometimes', 'string'],
            'destinationSiteId' => ['sometimes', 'string'],
            'destinationLocationId' => ['sometimes', 'string'],
            'lines' => ['sometimes', 'array', 'min:1', 'max:50'],
            'lines.*.itemId' => ['required_with:lines', 'string', 'distinct'],
            'lines.*.requestedQuantity' => ['required_with:lines', 'decimal:0,3', 'gt:0'],
        ];
    }
}
