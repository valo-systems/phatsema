<?php

declare(strict_types=1);

namespace App\Http\Requests\Assets;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'type' => ['required', Rule::in(['plant', 'transport', 'tank', 'workshop_equipment', 'attachment'])],
            'ownershipMode' => ['required', Rule::in(['company_owned', 'consignment', 'client_owned'])],
            'make' => ['required', 'string', 'max:60'],
            'model' => ['required', 'string', 'max:60'],
            'serialNumber' => ['required', 'string', 'max:60'],
            'registrationNumber' => ['nullable', 'string', 'max:20'],
            'siteId' => ['required', 'string'],
            'locationId' => ['nullable', 'string'],
            'meterType' => ['nullable', Rule::in(['hours', 'kilometres'])],
            'meterReading' => ['nullable', 'decimal:0,3', 'gte:0'],
            'nextServiceAt' => ['nullable', 'date'],
            'nextServiceMeter' => ['nullable', 'decimal:0,3', 'gte:0'],
        ];
    }
}
