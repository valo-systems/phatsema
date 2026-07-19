<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Identity\DepartmentCatalogue;
use App\Domain\Reference\ReferenceRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class ReferenceController extends Controller
{
    public function __construct(
        private readonly ReferenceRepository $reference,
        private readonly DepartmentCatalogue $departments,
    ) {}

    public function departments(): JsonResponse
    {
        return response()->json(['data' => $this->departments->all()]);
    }

    public function reasons(): JsonResponse
    {
        $reasons = array_values(array_filter($this->reference->getReasons(), fn ($r) => $r['active']));

        return response()->json([
            'data' => array_map(fn ($r) => [
                'code' => $r['code'],
                'name' => $r['name'],
                'appliesTo' => $r['appliesTo'] ?? $r['applies_to'] ?? [],
            ], $reasons),
        ]);
    }

    public function categories(): JsonResponse
    {
        $cats = array_values(array_filter($this->reference->getCategories(), fn ($c) => $c['active'] ?? true));

        return response()->json([
            'data' => array_map(fn ($c) => [
                'id' => $c['id'],
                'code' => $c['code'] ?? $c['id'],
                'name' => $c['name'],
            ], $cats),
        ]);
    }

    public function units(): JsonResponse
    {
        $units = array_values(array_filter($this->reference->getUnits(), fn ($u) => $u['active'] ?? true));

        return response()->json([
            'data' => array_map(fn ($u) => [
                'code' => $u['code'],
                'name' => $u['name'],
                'precision' => $u['precision'] ?? 2,
            ], $units),
        ]);
    }
}
