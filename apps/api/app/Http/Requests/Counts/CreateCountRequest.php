<?php

declare(strict_types=1);

namespace App\Http\Requests\Counts;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateCountRequest extends FormRequest
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
            'scope' => ['required', Rule::in(['all_items', 'category', 'selected_items'])],
            'scopeCategoryId' => ['nullable', 'required_if:scope,category', 'string'],
            'scopeItemIds' => ['nullable', 'required_if:scope,selected_items', 'array', 'min:1'],
            'scopeItemIds.*' => ['string', 'distinct'],
            'blindCount' => ['required', 'boolean'],
            'assignedUserIds' => ['sometimes', 'array'],
            'assignedUserIds.*' => ['string', 'distinct'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
