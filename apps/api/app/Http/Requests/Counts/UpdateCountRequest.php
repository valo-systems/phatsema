<?php

declare(strict_types=1);

namespace App\Http\Requests\Counts;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateCountRequest extends FormRequest
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
            'blindCount' => ['sometimes', 'boolean'],
            'assignedUserIds' => ['sometimes', 'array'],
            'assignedUserIds.*' => ['string', 'distinct'],
        ];
    }
}
