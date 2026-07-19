<?php

declare(strict_types=1);

namespace App\Http\Requests\Identity;

use App\Application\Identity\DepartmentCatalogue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(DepartmentCatalogue $departments): array
    {
        return [
            'version' => ['required', 'integer', 'min:1'],
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'preferredName' => ['nullable', 'string', 'max:80'],
            'workPhone' => ['nullable', 'string', 'max:32', 'regex:/^\+?[0-9 ()-]{7,32}$/'],
            'jobTitle' => ['nullable', 'string', 'max:120'],
            'departmentCode' => ['nullable', Rule::in($departments->codes())],
            'bio' => ['nullable', 'string', 'max:500'],
            'email' => ['prohibited'],
            'temporaryPassword' => ['nullable', 'string', 'min:12', 'max:100'],
            'role' => ['sometimes', Rule::in(['system_administrator', 'operations_manager', 'site_manager', 'storekeeper', 'executive_viewer'])],
            'allSites' => ['sometimes', 'boolean'],
            'assignedSiteIds' => ['sometimes', 'array'],
            'assignedSiteIds.*' => ['string', 'distinct'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ];
    }
}
