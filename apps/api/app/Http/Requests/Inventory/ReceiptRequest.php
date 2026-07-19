<?php

declare(strict_types=1);

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

final class ReceiptRequest extends FormRequest
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
            'reference' => ['required', 'string', 'max:60'],
            'receivedAt' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'lines' => ['required', 'array', 'min:1', 'max:50'],
            'lines.*.itemId' => ['required', 'string'],
            'lines.*.quantity' => ['required', 'decimal:0,3', 'gt:0'],
            'lines.*.batchCode' => ['nullable', 'string', 'max:40'],
        ];
    }
}
