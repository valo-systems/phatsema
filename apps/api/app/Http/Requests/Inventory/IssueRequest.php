<?php

declare(strict_types=1);

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

final class IssueRequest extends FormRequest
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
            'purpose' => ['required', 'in:site_consumption,project,maintenance,fabrication_job,cost_centre'],
            'recipient' => ['required', 'string', 'max:120'],
            'reference' => ['nullable', 'string', 'max:60'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'lines' => ['required', 'array', 'min:1', 'max:50'],
            'lines.*.itemId' => ['required', 'string'],
            'lines.*.quantity' => ['required', 'decimal:0,3', 'gt:0'],
        ];
    }
}
