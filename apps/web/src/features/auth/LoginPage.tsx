import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useLogin, sessionKeys } from '@/shared/auth/session';
import { isApiError } from '@/shared/api/problem';
import { env } from '@/shared/config/env';
import { Button } from '@/shared/ui/controls';
import { Field, ErrorSummary } from '@/shared/ui/controls';
import { Input } from '@/shared/ui/controls';
import { Badge } from '@/shared/ui/Badge';
import logoColor from '@/assets/brand/header/logo-header-40px.png';
import logoColor2x from '@/assets/brand/header/logo-header-40px@2x.png';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;

const PERSONAS: Array<{ label: string; description: string; email: string }> = [
  { label: 'System Administrator', description: 'Full configuration, users, reset, audit', email: 'admin@demo.phatsema.example' },
  { label: 'Operations Manager', description: 'All sites, approvals, dashboards, reports', email: 'operations@demo.phatsema.example' },
  { label: 'Site Manager', description: 'Assigned site, approvals, counts, transfers', email: 'sitemanager@demo.phatsema.example' },
  { label: 'Storekeeper', description: 'Receiving, issues, transfers, counting', email: 'storekeeper@demo.phatsema.example' },
  { label: 'Executive Viewer', description: 'Read-only dashboards, reports, activity', email: 'executive@demo.phatsema.example' },
];

const DEMO_PASSWORD = 'PhatsemaDemo1';

export function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    document.title = 'Sign in | Phatsema Portal';
  }, []);

  const submit = form.handleSubmit((values) => {
    setServerError(null);
    login.mutate(values, {
      onSuccess: () => {
        queryClient.removeQueries({ predicate: (query) => query.queryKey !== sessionKeys.me });
        void navigate(from, { replace: true });
      },
      onError: (error) => {
        if (isApiError(error) && error.status === 422) {
          setServerError('Those sign-in details were not recognised. Check the persona email and demo password.');
        } else if (isApiError(error) && error.status === 429) {
          setServerError('Too many attempts. Wait a moment and try again.');
        } else {
          setServerError('Sign-in is temporarily unavailable. Please try again.');
        }
      },
    });
  });

  const fillPersona = (email: string) => {
    form.setValue('email', email, { shouldValidate: true });
    form.setValue('password', DEMO_PASSWORD, { shouldValidate: true });
    setServerError(null);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-shell via-shell to-[#0e2f27] px-4 py-10">
      <div className="w-full max-w-4xl">
        <div className="grid overflow-hidden rounded-lg bg-surface shadow-overlay lg:grid-cols-[1.05fr_1fr]">
          {/* Sign-in panel */}
          <section className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex items-center gap-2.5">
              <img
                src={logoColor}
                srcSet={`${logoColor} 1x, ${logoColor2x} 2x`}
                alt="Phatsema"
                height={40}
                className="h-10 w-auto"
              />
              <p className="text-xs text-muted">Back-office portal</p>
            </div>

            <h1 className="mt-8 text-xl font-semibold text-ink">Sign in</h1>
            <p className="mt-1 text-sm text-muted">
              Use a demo persona to explore multi-site inventory, transfers, counts, and assets.
            </p>

            <form onSubmit={(event) => void submit(event)} noValidate className="mt-6 space-y-4">
              {serverError && <ErrorSummary title="Sign-in failed" errors={[serverError]} />}
              <Field label="Email" required error={form.formState.errors.email?.message}>
                <Input type="email" autoComplete="username" placeholder="you@phatsema.example" {...form.register('email')} />
              </Field>
              <Field label="Password" required error={form.formState.errors.password?.message}>
                <Input type="password" autoComplete="current-password" placeholder="Demo password" {...form.register('password')} />
              </Field>
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={login.isPending}>
                Sign in
              </Button>
            </form>

            <p className="mt-6 text-xs leading-relaxed text-faint">
              This is a demonstration environment. All names, sites, quantities, and values are fictional and
              are not Phatsema operational data.
            </p>
          </section>

          {/* Persona panel */}
          {env.demoMode && (
            <section className="border-t border-line bg-canvas px-6 py-8 sm:px-8 lg:border-t-0 lg:border-l">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">Demo personas</h2>
                <Badge tone="warning">Demo data</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">
                Select a persona to fill the form, then sign in. Password for every persona:{' '}
                <code className="rounded-sm bg-sunken px-1 py-0.5 text-[11px]">{DEMO_PASSWORD}</code>
              </p>
              <ul className="mt-4 space-y-2">
                {PERSONAS.map((persona) => (
                  <li key={persona.email}>
                    {/* eslint-disable-next-line no-restricted-syntax -- persona card is a composite clickable region, not a control */}
                    <button
                      type="button"
                      onClick={() => fillPersona(persona.email)}
                      className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-left transition-colors hover:border-primary-ring hover:bg-primary-soft/40"
                    >
                      <span className="block text-[13px] font-semibold text-ink">{persona.label}</span>
                      <span className="mt-0.5 block text-xs text-muted">{persona.description}</span>
                      <span className="mt-1 block text-[11px] text-faint" data-numeric>
                        {persona.email}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <p className="mt-4 text-center text-[11px] text-shell-muted">
          Phatsema Portal {env.appVersion} · demonstration build
        </p>
      </div>
    </main>
  );
}
