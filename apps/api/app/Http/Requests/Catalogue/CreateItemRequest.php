<?php

declare(strict_types=1);

namespace App\Http\Requests\Catalogue;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateItemRequest extends FormRequest
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
            'description' => ['nullable', 'string', 'max:2000'],
            'categoryId' => ['required', 'string'],
            'inventoryType' => ['required', Rule::in(['saleable', 'consumable', 'raw_material', 'spare_part', 'installation_component'])],
            'baseUnit' => ['required', 'string', 'max:10'],
            'trackingMode' => ['required', Rule::in(['quantity'])],
            'ownershipMode' => ['required', Rule::in(['company_owned', 'consignment', 'client_owned'])],
            'reorderPoint' => ['nullable', 'decimal:0,3', 'gte:0'],
            'targetLevel' => ['nullable', 'decimal:0,3', 'gte:0'],
        ];
    }
}
