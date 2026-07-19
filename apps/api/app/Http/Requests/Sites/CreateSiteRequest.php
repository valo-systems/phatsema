<?php

declare(strict_types=1);

namespace App\Http\Requests\Sites;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateSiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'entityCode' => ['required', Rule::in(['PHATSEMA_PROJECTS', 'PHATSEMA_MINING'])],
            'type' => ['required', Rule::in(['head_office', 'warehouse', 'mine_site', 'workshop', 'fabrication', 'depot'])],
            'countryCode' => ['required', 'string', 'size:2'],
            'timezone' => ['required', 'timezone'],
            'contactName' => ['nullable', 'string', 'max:120'],
            'contactPhone' => ['nullable', 'string', 'max:40'],
        ];
    }
}
