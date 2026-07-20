import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Collapsible } from '@ark-ui/react/collapsible';
import {
  BadgeCheck,
  Boxes,
  ChevronRight,
  ClipboardCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { useLogin, sessionKeys } from '@/shared/auth/session';
import { isApiError } from '@/shared/api/problem';
import { env } from '@/shared/config/env';
import { Button, ErrorSummary, Field, IconButton, TextField } from '@/shared/ui/controls';
import logoFullColor from '@/assets/brand/logo/logo-full-color-transparent.png';
import logoReversed from '@/assets/brand/logo/logo-full-reversed.png';
import warehouseHero from '@/assets/auth/warehouse-hero.webp';

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

const BENEFITS = [
  {
    title: 'Multi-site visibility',
    description: 'Monitor stock and assets across all locations in real time.',
    icon: Boxes,
  },
  {
    title: 'Operational control',
    description: 'Manage transfers, counts, and adjustments with confidence.',
    icon: ClipboardCheck,
  },
  {
    title: 'Data you can trust',
    description: 'Accurate, up-to-date information to support every decision.',
    icon: BadgeCheck,
  },
] as const;

const DEMO_PASSWORD = 'PhatsemaDemo1';

export function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [personasOpen, setPersonasOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

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
    setPersonasOpen(false);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-shell">
      <img
        src={warehouseHero}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div aria-hidden className="absolute inset-0 bg-[#071322]/65" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,14,27,0.96)_0%,rgba(6,18,32,0.86)_32%,rgba(8,23,38,0.55)_58%,rgba(7,20,33,0.78)_100%)]"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-40 h-[42rem] w-[42rem] rounded-full bg-primary/20 blur-3xl"
      />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[minmax(28rem,0.94fr)_minmax(30rem,0.86fr)]">
        <section className="relative hidden min-h-screen items-center overflow-hidden px-12 py-12 lg:flex xl:pl-20 xl:pr-10 2xl:pl-24">
          <svg
            aria-hidden
            viewBox="0 0 760 900"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <defs>
              <linearGradient id="login-arc-metal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#86a9bd" stopOpacity="0.05" />
                <stop offset="28%" stopColor="#b8d0dc" stopOpacity="0.42" />
                <stop offset="48%" stopColor="#f2f7f8" stopOpacity="0.7" />
                <stop offset="69%" stopColor="#4eb995" stopOpacity="0.48" />
                <stop offset="100%" stopColor="#0ea47f" stopOpacity="0.06" />
              </linearGradient>
              <filter id="login-arc-glow" x="-50%" y="-10%" width="200%" height="120%">
                <feGaussianBlur stdDeviation="3.2" />
              </filter>
            </defs>
            <path
              d="M 354 -20 C 418 126 510 286 520 447 C 534 654 424 821 286 930"
              fill="none"
              stroke="url(#login-arc-metal)"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.22"
              filter="url(#login-arc-glow)"
            />
            <path
              d="M 354 -20 C 418 126 510 286 520 447 C 534 654 424 821 286 930"
              fill="none"
              stroke="url(#login-arc-metal)"
              strokeWidth="1.15"
              strokeLinecap="round"
              opacity="0.76"
            />
          </svg>

          <div className="relative z-10 max-w-[29rem]">
            <img src={logoReversed} alt="Phatsema Projects & Supplies" className="h-auto w-64 max-w-full" />

            <h1 className="mt-10 max-w-[28rem] text-4xl font-semibold leading-[1.1] tracking-[-0.035em] text-white xl:text-[2.75rem]">
              Smarter inventory.
              <span className="mt-1 block text-primary-ring">Stronger operations.</span>
            </h1>
            <p className="mt-5 max-w-[25rem] text-[15px] leading-6 text-shell-muted xl:text-base">
              Phatsema Back-office Portal gives you complete control of your multi-site inventory,
              transfers, counts, and assets.
            </p>

            <ul className="mt-8 space-y-5">
              {BENEFITS.map((benefit) => {
                const BenefitIcon = benefit.icon;
                return (
                  <li key={benefit.title} className="flex items-start gap-3.5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-primary-ring/60 bg-primary/10 text-primary-ring">
                      <BenefitIcon aria-hidden className="size-[18px]" />
                    </span>
                    <span className="pt-0.5">
                      <span className="block text-sm font-semibold text-white">{benefit.title}</span>
                      <span className="mt-0.5 block max-w-[19rem] text-[13px] leading-5 text-shell-muted">
                        {benefit.description}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-5 sm:px-7 sm:py-7 lg:justify-start lg:px-6 lg:py-8 xl:pl-6 xl:pr-8">
          <div className="w-full max-w-[32.5rem]">
            <div className="rounded-xl border border-white/55 bg-surface px-5 py-6 shadow-[0_24px_70px_rgba(3,12,24,0.38)] sm:px-8 sm:py-8 xl:px-10 xl:py-9">
              <img
                src={logoFullColor}
                alt="Phatsema Projects & Supplies"
                className="h-auto w-56 max-w-[78%]"
              />
              <p className="mt-3.5 text-sm font-medium text-muted">Back-office portal</p>

              <h2 className="mt-5 text-[1.75rem] font-semibold tracking-[-0.025em] text-ink">Sign in</h2>
              <p className="mt-1.5 max-w-[26rem] text-sm leading-5 text-muted">
                Use a demo persona to explore multi-site inventory, transfers, counts, and assets.
              </p>

              <form onSubmit={(event) => void submit(event)} noValidate className="mt-5 space-y-4">
                {serverError && <ErrorSummary title="Sign-in failed" errors={[serverError]} />}
                <Field label="Email address" required error={form.formState.errors.email?.message}>
                  <TextField
                    type="email"
                    autoComplete="username"
                    placeholder="you@phatsema.example"
                    leading={<Mail className="size-4" />}
                    {...form.register('email')}
                  />
                </Field>
                <Field label="Password" required error={form.formState.errors.password?.message}>
                  <TextField
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Demo password"
                    leading={<LockKeyhole className="size-4" />}
                    trailing={
                      <IconButton
                        aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                        aria-pressed={passwordVisible}
                        icon={passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        variant="ghost"
                        size="sm"
                        className="-mr-2"
                        onClick={() => setPasswordVisible((visible) => !visible)}
                      />
                    }
                    {...form.register('password')}
                  />
                </Field>
                <Button type="submit" variant="primary" size="lg" className="w-full gap-2" loading={login.isPending}>
                  {!login.isPending && <LockKeyhole aria-hidden className="size-4" />}
                  Sign in
                </Button>
              </form>

              {env.demoMode && (
                <>
                  <div className="my-5 flex items-center gap-3.5" aria-hidden>
                    <span className="h-px flex-1 bg-line" />
                    <span className="text-[11px] font-medium tracking-[0.09em] text-faint">OR CONTINUE AS</span>
                    <span className="h-px flex-1 bg-line" />
                  </div>

                  <Collapsible.Root
                    open={personasOpen}
                    onOpenChange={(details) => setPersonasOpen(details.open)}
                  >
                    <Collapsible.Trigger
                      aria-expanded={personasOpen}
                      className="focus-ring flex h-control-lg w-full items-center gap-3 rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:border-faint hover:bg-sunken"
                    >
                      <UsersRound aria-hidden className="size-4" />
                      <span className="flex-1 text-left">Demo personas</span>
                      <ChevronRight
                        aria-hidden
                        className={`size-4 transition-transform duration-150 ${personasOpen ? 'rotate-90' : ''}`}
                      />
                    </Collapsible.Trigger>
                    <Collapsible.Content
                      id="demo-personas-panel"
                      className="mt-2.5 overflow-hidden data-[state=open]:animate-fade-in"
                    >
                      {personasOpen && (
                        <>
                          <p className="rounded-md bg-sunken px-3 py-2 text-xs leading-relaxed text-muted">
                            Select a persona to fill the form. Shared password:{' '}
                            <code className="font-semibold text-ink">{DEMO_PASSWORD}</code>
                          </p>
                          <ul className="mt-2 grid max-h-52 gap-2 overflow-y-auto pr-1 scrollbar-thin">
                            {PERSONAS.map((persona) => (
                              <li key={persona.email}>
                                {/* eslint-disable-next-line no-restricted-syntax -- composite persona selector */}
                                <button
                                  type="button"
                                  onClick={() => fillPersona(persona.email)}
                                  className="focus-ring w-full rounded-md border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-primary-ring hover:bg-primary-soft/35"
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
                        </>
                      )}
                    </Collapsible.Content>
                  </Collapsible.Root>
                </>
              )}

              <div className="mt-5 flex gap-2.5 border-t border-line pt-4 text-xs leading-5 text-faint">
                <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
                <p>
                  This is a demonstration environment. All names, sites, quantities, and values are
                  fictional and are not Phatsema operational data.
                </p>
              </div>
            </div>

            <p className="mt-3 text-center text-[11px] text-shell-muted">
              Phatsema Portal {env.appVersion} · demonstration build
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
