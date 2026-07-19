<?php

declare(strict_types=1);

namespace App\Application\Catalogue;

use App\Application\Exceptions\AuthorizationDenied;
use App\Application\Exceptions\ConcurrencyConflict;
use App\Application\Exceptions\DomainRuleViolation;
use App\Application\Exceptions\ResourceNotFound;
use App\Application\Identity\CurrentActor;
use App\Domain\Audit\AuditRepository;
use App\Domain\Catalogue\CatalogueRepository;
use App\Domain\Inventory\Quantity;
use App\Domain\Reference\ReferenceRepository;
use App\Domain\Shared\SequenceRepository;
use App\Domain\Shared\UnitOfWork;
use App\Policies\AdministrationPolicy;

final readonly class CatalogueCommandService
{
    public function __construct(
        private CatalogueRepository $catalogue,
        private ReferenceRepository $reference,
        private AuditRepository $audit,
        private UnitOfWork $unitOfWork,
        private CurrentActor $actor,
        private AdministrationPolicy $policy,
        private SequenceRepository $sequences,
    ) {}

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function create(array $command): array
    {
        $this->authorize();
        if ($this->hasDuplicateName((string) $command['name'])) {
            throw new DomainRuleViolation('An item with this name already exists.');
        }
        $item = $this->catalogue->createItem([
            'code' => $this->sequences->nextRef('DEMO-ITM'),
            'name' => $command['name'],
            'description' => $command['description'] ?? null,
            'category_id' => $command['categoryId'],
            'unit_id' => $this->unitId((string) $command['baseUnit']),
            'item_type' => $command['inventoryType'],
            'tracking_mode' => $command['trackingMode'],
            'ownership_mode' => $command['ownershipMode'],
            'min_stock' => isset($command['reorderPoint'])
                ? Quantity::from($command['reorderPoint'])->toString()
                : null,
            'target_level' => isset($command['targetLevel'])
                ? Quantity::from($command['targetLevel'])->toString()
                : null,
        ]);
        $this->recordAudit('item.created', $item, 'Catalogue item created');
        $this->unitOfWork->commit();

        return $item;
    }

    /** @param array<string, mixed> $command
     * @return array<string, mixed>
     */
    public function update(string $id, array $command): array
    {
        $this->authorize();
        $item = $this->catalogue->findItem($id) ?? throw new ResourceNotFound('Item not found.');
        if ((int) $item['version'] !== (int) $command['version']) {
            throw new ConcurrencyConflict;
        }
        $fields = [
            'name' => 'name',
            'description' => 'description',
            'categoryId' => 'category_id',
            'reorderPoint' => 'min_stock',
            'targetLevel' => 'target_level',
        ];
        $update = [];
        foreach ($fields as $input => $field) {
            if (array_key_exists($input, $command)) {
                $value = $command[$input];
                $update[$field] = in_array($input, ['reorderPoint', 'targetLevel'], true) && $value !== null
                    ? Quantity::from($value)->toString()
                    : $value;
            }
        }
        if (isset($command['status'])) {
            $update['active'] = $command['status'] === 'active';
        }
        $updated = $this->catalogue->updateItem($id, $update) ?? throw new ResourceNotFound('Item not found.');
        $this->recordAudit('item.updated', $updated, 'Catalogue item updated');
        $this->unitOfWork->commit();

        return $updated;
    }

    private function authorize(): void
    {
        if (! $this->policy->manageCatalogue()) {
            throw new AuthorizationDenied;
        }
    }

    private function unitId(string $code): string
    {
        foreach ($this->reference->getUnits() as $unit) {
            if (strcasecmp((string) $unit['code'], $code) === 0) {
                return (string) $unit['id'];
            }
        }

        throw new ResourceNotFound("Unit {$code} not found.");
    }

    private function hasDuplicateName(string $name): bool
    {
        foreach ($this->catalogue->getItems() as $item) {
            if (strcasecmp(trim((string) $item['name']), trim($name)) === 0) {
                return true;
            }
        }

        return false;
    }

    /** @param array<string, mixed> $item */
    private function recordAudit(string $type, array $item, string $summary): void
    {
        $this->audit->createAuditEvent([
            'event_type' => $type,
            'resource_type' => 'item',
            'resource_id' => $item['id'],
            'user_id' => $this->actor->id(),
            'site_id' => null,
            'summary' => "{$summary}: {$item['code']} / {$item['name']}",
            'payload' => ['sku' => $item['code']],
        ]);
    }
}
