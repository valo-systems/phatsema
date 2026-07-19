import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isApiError } from '@/shared/api/problem';
import { Dialog } from '@/shared/ui/overlays';
import { Button } from '@/shared/ui/controls';
import { Field, ErrorSummary } from '@/shared/ui/controls';
import { Input, FormSelect } from '@/shared/ui/controls';
import { enumOptions } from '@/shared/ui/controls/options';
import { toast } from '@/shared/ui/toast';
import { useCreateSite, useUpdateSite, type Site } from './api';

const SITE_TYPES = ['head_office', 'warehouse', 'mine_site', 'workshop', 'fabrication', 'depot'] as const;
const OPERATING_BUSINESSES = [
  ['PHATSEMA_PROJECTS', 'Phatsema Projects & Supplies'],
  ['PHATSEMA_MINING', 'Phatsema Mining'],
] as const;
const COUNTRIES = [
  ['ZA', 'South Africa'],
  ['BW', 'Botswana'],
  ['ZM', 'Zambia'],
  ['ZW', 'Zimbabwe'],
  ['MZ', 'Mozambique'],
  ['NA', 'Namibia'],
] as const;
const TIMEZONES = ['Africa/Johannesburg', 'Africa/Gaborone', 'Africa/Lusaka', 'Africa/Harare', 'Africa/Maputo', 'Africa/Windhoek'] as const;

const schema = z.object({
  name: z.string().min(2, 'Enter a site name').max(100),
  entityCode: z.enum(['PHATSEMA_PROJECTS', 'PHATSEMA_MINING'], { error: 'Select an operating business' }),
  type: z.enum(SITE_TYPES, { error: 'Select a site type' }),
  countryCode: z.string().length(2, 'Enter a 2-letter country code'),
  timezone: z.string().min(1, 'Enter a timezone'),
  contactName: z.string().max(100).optional(),
  contactPhone: z.string().max(30).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site?: Site;
}

export function SiteFormDialog({ open, onOpenChange, site }: Props) {
  const create = useCreateSite();
  const update = useUpdateSite(site?.id ?? '');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      entityCode: 'PHATSEMA_PROJECTS',
      type: 'warehouse',
      countryCode: 'ZA',
      timezone: 'Africa/Johannesburg',
      contactName: '',
      contactPhone: '',
    },
  });

  useEffect(() => {
    if (open && site) {
      form.reset({
        name: site.name,
        entityCode: site.entityCode === 'PHATSEMA_MINING' ? 'PHATSEMA_MINING' : 'PHATSEMA_PROJECTS',
        type: site.type,
        countryCode: site.countryCode,
        timezone: site.timezone,
        contactName: site.contactName ?? '',
        contactPhone: site.contactPhone ?? '',
      });
    } else if (open && !site) {
      form.reset();
    }
  }, [open, site, form]);

  const isEditing = Boolean(site);
  const isPending = create.isPending || update.isPending;
  const mutationError = create.error ?? update.error;

  const serverErrors = isApiError(mutationError)
    ? [
        ...(mutationError.problem.detail ? [mutationError.problem.detail] : []),
        ...Object.values(mutationError.fieldErrors).flat(),
      ]
    : mutationError
      ? ['Could not save the site. Please try again.']
      : [];

  const onSubmit = form.handleSubmit((values) => {
    const body = {
      name: values.name,
      entityCode: values.entityCode,
      type: values.type,
      countryCode: values.countryCode.toUpperCase(),
      timezone: values.timezone,
      ...(values.contactName?.trim() ? { contactName: values.contactName.trim() } : {}),
      ...(values.contactPhone?.trim() ? { contactPhone: values.contactPhone.trim() } : {}),
    };

    if (isEditing && site) {
      update.mutate(
        { ...body, version: site.version },
        {
          onSuccess: () => {
            toast('success', 'Site updated', `${values.name} has been saved.`);
            onOpenChange(false);
          },
        },
      );
    } else {
      create.mutate(body, {
        onSuccess: () => {
          toast('success', 'Site created', `${values.name} is now live.`);
          onOpenChange(false);
        },
      });
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit site' : 'New site'}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="site-form" variant="primary" loading={isPending}>
            {isEditing ? 'Save changes' : 'Create site'}
          </Button>
        </>
      }
    >
      <form id="site-form" onSubmit={onSubmit} noValidate className="space-y-3">
        {serverErrors.length > 0 && <ErrorSummary errors={serverErrors} />}

        {!site && (
          <p className="rounded-md border border-line bg-sunken px-3 py-2 text-xs text-muted">
            The site code is generated automatically. Select the operating business so users do not have to type an internal code.
          </p>
        )}

        <Field label="Operating business" required control="custom" error={form.formState.errors.entityCode?.message}>
          <FormSelect
            control={form.control}
            name="entityCode"
            aria-label="Operating business"
            options={OPERATING_BUSINESSES.map(([code, name]) => ({ value: code, label: name }))}
          />
        </Field>

        <Field label="Name" required error={form.formState.errors.name?.message}>
          <Input {...form.register('name')} placeholder="e.g. DEMO Johannesburg Warehouse" maxLength={100} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type" required control="custom" error={form.formState.errors.type?.message}>
            <FormSelect
              control={form.control}
              name="type"
              aria-label="Site type"
              options={enumOptions(SITE_TYPES)}
            />
          </Field>
          <Field label="Country" required control="custom" error={form.formState.errors.countryCode?.message}>
            <FormSelect
              control={form.control}
              name="countryCode"
              aria-label="Country"
              options={COUNTRIES.map(([code, name]) => ({ value: code, label: `${name} (${code})` }))}
            />
          </Field>
        </div>

        <Field label="Timezone" required control="custom" error={form.formState.errors.timezone?.message}>
          <FormSelect
            control={form.control}
            name="timezone"
            aria-label="Timezone"
            options={TIMEZONES.map((timezone) => ({ value: timezone, label: timezone }))}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Contact name" error={form.formState.errors.contactName?.message}>
            <Input {...form.register('contactName')} placeholder="Optional" maxLength={100} />
          </Field>
          <Field label="Contact phone" error={form.formState.errors.contactPhone?.message}>
            <Input {...form.register('contactPhone')} placeholder="Optional" maxLength={30} />
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
