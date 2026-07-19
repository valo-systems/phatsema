<?php

declare(strict_types=1);

namespace App\Http\Requests\Counts;

use Illuminate\Foundation\Http\FormRequest;

final class SaveCountEntriesRequest extends FormRequest
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
            'entries' => ['required', 'array', 'min:1'],
            'entries.*.entryId' => ['required', 'string', 'distinct'],
            'entries.*.countedQuantity' => ['required', 'decimal:0,3', 'gte:0'],
            'entries.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
