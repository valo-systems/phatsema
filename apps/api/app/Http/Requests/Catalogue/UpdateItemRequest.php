<?php

declare(strict_types=1);

namespace App\Http\Requests\Catalogue;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateItemRequest extends FormRequest
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
            'description' => ['nullable', 'string', 'max:2000'],
            'categoryId' => ['sometimes', 'string'],
            'reorderPoint' => ['nullable', 'decimal:0,3', 'gte:0'],
            'targetLevel' => ['nullable', 'decimal:0,3', 'gte:0'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ];
    }
}
