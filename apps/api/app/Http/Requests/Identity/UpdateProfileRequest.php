<?php

declare(strict_types=1);

namespace App\Http\Requests\Identity;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateProfileRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:120'],
            'preferredName' => ['nullable', 'string', 'max:80'],
            'workPhone' => ['nullable', 'string', 'max:32', 'regex:/^\+?[0-9 ()-]{7,32}$/'],
            'bio' => ['nullable', 'string', 'max:500'],
            'email' => ['prohibited'],
            'jobTitle' => ['prohibited'],
            'departmentCode' => ['prohibited'],
            'role' => ['prohibited'],
            'status' => ['prohibited'],
            'allSites' => ['prohibited'],
            'assignedSiteIds' => ['prohibited'],
        ];
    }
}
