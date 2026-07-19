<?php

declare(strict_types=1);

namespace App\Http\Requests\Transfers;

use Illuminate\Foundation\Http\FormRequest;

final class CreateTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'sourceSiteId' => ['required', 'string', 'different:destinationSiteId'],
            'sourceLocationId' => ['required', 'string', 'different:destinationLocationId'],
            'destinationSiteId' => ['required', 'string'],
            'destinationLocationId' => ['required', 'string'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'lines' => ['required', 'array', 'min:1', 'max:50'],
            'lines.*.itemId' => ['required', 'string', 'distinct'],
            'lines.*.requestedQuantity' => ['required', 'decimal:0,3', 'gt:0'],
        ];
    }
}
