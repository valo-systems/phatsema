<?php

declare(strict_types=1);

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

final class AdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'siteId' => ['required', 'string'],
            'locationId' => ['required', 'string'],
            'itemId' => ['required', 'string'],
            'direction' => ['required', 'in:increase,decrease'],
            'quantity' => ['required', 'decimal:0,3', 'gt:0'],
            'reasonCode' => ['required', 'string'],
            'adjustedAt' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
