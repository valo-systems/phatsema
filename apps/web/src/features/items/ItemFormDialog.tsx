import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useItemCategories, useUnits } from '@/shared/api/reference';
import { isApiError } from '@/shared/api/problem';
import { Dialog } from '@/shared/ui/overlays';
import { Button } from '@/shared/ui/controls';
import { Field, ErrorSummary } from '@/shared/ui/controls';
import { TextField, NumberField, TextArea, FormSelect } from '@/shared/ui/controls';
import { toast } from '@/shared/ui/toast';
import { enumOptions, recordOptions, INVENTORY_TYPE_VALUES } from '@/shared/ui/controls/options';
import { isValidQuantity } from '@/shared/format/dec';
import { useCreateItem, useUpdateItem, type ItemDetail } from './api';

const quantityField = z
  .string()
  .trim()
  .refine((value) => value === '' || isValidQuantity(value), 'Enter a positive quantity (up to 3 decimals)');

const itemSchema = z.object({
  name: z.string().trim().min(3, 'Name is required').max(160),
  description: z.string().trim().max(2000).optional(),
  categoryId: z.string().min(1, 'Select a category'),
  inventoryType: z.enum(['saleable', 'consumable', 'raw_material', 'spare_part', 'installation_component']),
  baseUnit: z.string().min(1, 'Select a unit'),
  trackingMode: z.literal('quantity'),
  ownershipMode: z.enum(['company_owned', 'consignment', 'client_owned']),
  reorderPoint: quantityField,
  targetLevel: quantityField,
});

type ItemValues = z.infer<typeof itemSchema>;

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the dialog edits; otherwise it creates. */
  item?: ItemDetail | undefined;
}) {
  const categories = useItemCategories();
  const units = useUnits();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem(item?.id ?? '');
  const mutation = item ? updateItem : createItem;

  const form = useForm<ItemValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      inventoryType: 'consumable',
      baseUnit: '',
      trackingMode: 'quantity',
      ownershipMode: 'company_owned',
      reorderPoint: '',
      targetLevel: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        item
          ? {
              name: item.name,
              description: item.description ?? '',
              categoryId: item.categoryId,
              inventoryType: item.inventoryType,
              baseUnit: item.baseUnit,
              trackingMode: 'quantity',
              ownershipMode: item.ownershipMode,
              reorderPoint: item.reorderPoint ?? '',
              targetLevel: item.targetLevel ?? '',
            }
          : undefined,
      );
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const serverErrors = isApiError(mutation.error)
    ? Object.entries(mutation.error.fieldErrors).map(([field, messages]) => `${field}: ${messages.join(' ')}`)
    : mutation.error
      ? ['The item could not be saved. Please try again.']
      : [];

  const submit = form.handleSubmit((values) => {
    const onSuccess = () => {
      toast('success', item ? 'Item updated' : 'Item created', values.name);
      onOpenChange(false);
    };
    if (item) {
      updateItem.mutate(
        {
          name: values.name,
          description: values.description ?? '',
          categoryId: values.categoryId,
          reorderPoint: values.reorderPoint || null,
          targetLevel: values.targetLevel || null,
          version: item.version,
        },
        { onSuccess },
      );
    } else {
      createItem.mutate(
        {
          name: values.name,
          ...(values.description ? { description: values.description } : {}),
          categoryId: values.categoryId,
          inventoryType: values.inventoryType,
          baseUnit: values.baseUnit,
          trackingMode: values.trackingMode,
          ownershipMode: values.ownershipMode,
          ...(values.reorderPoint ? { reorderPoint: values.reorderPoint } : {}),
          ...(values.targetLevel ? { targetLevel: values.targetLevel } : {}),
        },
        { onSuccess },
      );
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? `Edit ${item.sku}` : 'New catalogue item'}
      description={item ? 'Classification fields are fixed after creation.' : 'Create a fictional demo item.'}
      wide
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" loading={mutation.isPending} onClick={() => void submit()}>
            {item ? 'Save changes' : 'Create item'}
          </Button>
        </>
      }
    >
      <form onSubmit={(event) => void submit(event)} noValidate className="space-y-4">
        {serverErrors.length > 0 && <ErrorSummary errors={serverErrors} />}
        {!item && (
          <p className="rounded-md border border-line bg-sunken px-3 py-2 text-xs text-muted">
            The SKU is generated automatically when the item is created.
          </p>
        )}
        <Field label="Name" required error={form.formState.errors.name?.message}>
          <TextField {...form.register('name')} />
        </Field>
        <Field label="Description" error={form.formState.errors.description?.message}>
          <TextArea {...form.register('description')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" required control="custom" error={form.formState.errors.categoryId?.message}>
            <FormSelect
              control={form.control}
              name="categoryId"
              aria-label="Category"
              placeholder="Select…"
              options={recordOptions(categories.data, (category) => category.name)}
            />
          </Field>
          <Field label="Inventory type" required control="custom" error={form.formState.errors.inventoryType?.message}>
            <FormSelect
              control={form.control}
              name="inventoryType"
              aria-label="Inventory type"
              disabled={Boolean(item)}
              options={enumOptions(INVENTORY_TYPE_VALUES)}
            />
          </Field>
          <Field label="Base unit" required control="custom" error={form.formState.errors.baseUnit?.message}>
            <FormSelect
              control={form.control}
              name="baseUnit"
              aria-label="Base unit"
              placeholder="Select…"
              disabled={Boolean(item)}
              options={(units.data ?? []).map((unit) => ({
                value: unit.code,
                label: `${unit.name} (${unit.code})`,
              }))}
            />
          </Field>
          <Field label="Tracking" required control="custom" error={form.formState.errors.trackingMode?.message}>
            <div>
              <FormSelect
                control={form.control}
                name="trackingMode"
                aria-label="Tracking"
                disabled={Boolean(item)}
                options={[{ value: 'quantity', label: 'Quantity' }]}
              />
              {!item && (
                <p className="mt-1 text-xs text-muted">
                  Batch and serial tracking stay unavailable until their full custody workflows are enabled.
                </p>
              )}
            </div>
          </Field>
          <Field label="Ownership" required control="custom" error={form.formState.errors.ownershipMode?.message}>
            <FormSelect
              control={form.control}
              name="ownershipMode"
              aria-label="Ownership"
              disabled={Boolean(item)}
              options={enumOptions(['company_owned', 'consignment', 'client_owned'])}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Reorder point" error={form.formState.errors.reorderPoint?.message} hint="Low-stock alert threshold">
            <Controller control={form.control} name="reorderPoint" render={({ field }) => <NumberField value={field.value} onValueChange={field.onChange} unit={form.watch('baseUnit') || undefined} placeholder="0" />} />
          </Field>
          <Field label="Target level" error={form.formState.errors.targetLevel?.message} hint="Excess above this level">
            <Controller control={form.control} name="targetLevel" render={({ field }) => <NumberField value={field.value} onValueChange={field.onChange} unit={form.watch('baseUnit') || undefined} placeholder="0" />} />
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
