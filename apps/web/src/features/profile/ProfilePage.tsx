import { useEffect, useMemo, useState } from 'react';
import { Clock3, KeyRound, ShieldCheck } from 'lucide-react';
import { useDepartments, useSitesReference } from '@/shared/api/reference';
import { isApiError } from '@/shared/api/problem';
import { useSession } from '@/shared/auth/session';
import { formatDateTime } from '@/shared/format/format';
import { displayName, initials } from '@/shared/format/person';
import { Badge, StatusPill } from '@/shared/ui/Badge';
import { Button, ErrorSummary, Field, Input, Textarea } from '@/shared/ui/controls';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader, DescriptionList, PageSkeleton } from '@/shared/ui/surfaces';
import { toast } from '@/shared/ui/toast';
import { useChangePassword, useUpdateProfile } from './api';
import { validatePasswordChange, validatePersonalProfile } from './validation';

export function ProfilePage() {
  const session = useSession();
  const departments = useDepartments();
  const sites = useSitesReference();
  const update = useUpdateProfile();
  const password = useChangePassword();
  const user = session.data;

  const [name, setName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [profileAttempted, setProfileAttempted] = useState(false);
  const [passwordAttempted, setPasswordAttempted] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPreferredName(user.preferredName ?? '');
    setWorkPhone(user.workPhone ?? '');
    setBio(user.bio ?? '');
  }, [user]);

  const departmentName = departments.data?.find((department) => department.code === user?.departmentCode)?.name ?? 'Not assigned';
  const assignedSites = useMemo(() => {
    if (user?.allSites) return 'All sites';
    const names = sites.data?.filter((site) => user?.assignedSiteIds.includes(site.id)).map((site) => site.name) ?? [];
    return names.length > 0 ? names.join(', ') : 'No sites assigned';
  }, [sites.data, user]);

  if (!user || session.isPending) return <PageSkeleton />;

  const profileErrors = validatePersonalProfile({ name, preferredName, workPhone, bio });
  const profileApiErrors = isApiError(update.error)
    ? [update.error.problem.detail ?? 'Your profile could not be saved.']
    : [];
  const passwordErrors = validatePasswordChange({ currentPassword, newPassword, newPasswordConfirmation });
  const passwordApiErrors = isApiError(password.error)
    ? [password.error.problem.detail ?? 'Your password could not be changed.']
    : [];

  const saveProfile = () => {
    setProfileAttempted(true);
    if (profileErrors.length > 0) return;
    update.mutate(
      {
        version: user.version,
        name: name.trim(),
        preferredName: preferredName.trim() || null,
        workPhone: workPhone.trim() || null,
        bio: bio.trim() || null,
      },
      {
        onSuccess: () => toast('success', 'Profile saved'),
        onError: (error) => {
          if (isApiError(error) && error.status === 409) {
            void session.refetch();
            toast('warning', 'Profile refreshed', 'Another update was saved first. Review the latest details and try again.');
          }
        },
      },
    );
  };

  const changePassword = () => {
    setPasswordAttempted(true);
    if (passwordErrors.length > 0) return;
    password.mutate(
      { currentPassword, newPassword, newPasswordConfirmation },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setNewPasswordConfirmation('');
          setPasswordAttempted(false);
          toast('success', 'Password changed', 'Your current session remains active.');
        },
      },
    );
  };

  return (
    <div>
      <PageHeader title="My profile" description="Manage your personal work details and account security." />

      <Card className="mb-5 overflow-hidden">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-primary-soft/80 to-surface px-5 py-5 sm:flex-row sm:items-center">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-xl font-semibold text-white shadow-medium">
            {initials(user)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold text-ink">{displayName(user)}</h2>
              <StatusPill status={user.status} />
            </div>
            {user.preferredName && user.preferredName !== user.name && <p className="mt-0.5 text-sm text-muted">{user.name}</p>}
            <p className="mt-1 text-sm text-muted">{user.email}</p>
          </div>
          <Badge tone="primary"><ShieldCheck aria-hidden className="size-3" />{user.roles[0]?.name ?? 'User'}</Badge>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Personal information" description="These details help colleagues identify and contact you at work." />
            <div className="space-y-4 p-4 sm:p-5">
              {profileApiErrors.length > 0 && <ErrorSummary errors={profileApiErrors} />}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required><Input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} /></Field>
                <Field label="Preferred name" hint="Used in menus and your initials"><Input value={preferredName} maxLength={80} onChange={(event) => setPreferredName(event.target.value)} /></Field>
                <Field label="Email" hint="Your administrator controls this login identifier"><Input value={user.email} readOnly disabled /></Field>
                <Field label="Work phone"><Input value={workPhone} maxLength={32} inputMode="tel" onChange={(event) => setWorkPhone(event.target.value)} /></Field>
              </div>
              <Field label="Biography" hint={`${bio.length}/500 characters`}>
                <Textarea value={bio} maxLength={500} rows={4} onChange={(event) => setBio(event.target.value)} />
              </Field>
              {profileAttempted && profileErrors.length > 0 && <ErrorSummary errors={profileErrors} />}
              <div className="flex justify-end">
                <Button variant="primary" loading={update.isPending} onClick={saveProfile}>Save profile</Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Security" description="Use a unique password of at least 12 characters." />
            <div className="space-y-4 p-4 sm:p-5">
              {passwordApiErrors.length > 0 && <ErrorSummary errors={passwordApiErrors} />}
              <Field label="Current password" required><Input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="New password" required><Input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></Field>
                <Field label="Confirm new password" required><Input type="password" autoComplete="new-password" value={newPasswordConfirmation} onChange={(event) => setNewPasswordConfirmation(event.target.value)} /></Field>
              </div>
              {passwordAttempted && passwordErrors.length > 0 && <ErrorSummary errors={passwordErrors} />}
              <div className="flex justify-end">
                <Button variant="primary" loading={password.isPending} onClick={changePassword}><KeyRound aria-hidden className="size-4" />Change password</Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Employment" description="Contact an administrator if these details need changing." />
            <DescriptionList className="p-4 sm:p-5" items={[
              { term: 'Job title', detail: user.jobTitle ?? 'Not assigned' },
              { term: 'Department', detail: departmentName },
            ]} />
          </Card>

          <Card>
            <CardHeader title="Access" description="Your effective access is controlled by your role and assigned sites." />
            <DescriptionList className="p-4 sm:p-5" items={[
              { term: 'Role', detail: user.roles[0]?.name ?? 'No role assigned' },
              { term: 'Site scope', detail: assignedSites },
              { term: 'All-site access', detail: user.allSites ? 'Enabled' : 'Not enabled' },
            ]} />
            <div className="border-t border-line px-4 py-4 sm:px-5">
              <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">Effective permissions</p>
              <div className="flex flex-wrap gap-1.5">
                {user.permissions.length > 0
                  ? user.permissions.map((permission) => <Badge key={permission} tone="neutral">{permission}</Badge>)
                  : <span className="text-sm text-muted">No permissions assigned</span>}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Account activity" />
            <div className="flex items-start gap-3 p-4 sm:p-5">
              <span className="grid size-9 place-items-center rounded-md bg-sunken text-muted"><Clock3 aria-hidden className="size-4" /></span>
              <div>
                <p className="text-xs font-medium tracking-wide text-muted uppercase">Last successful sign-in</p>
                <p className="mt-1 text-sm font-medium text-ink">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'No sign-in recorded'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
