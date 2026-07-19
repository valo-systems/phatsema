import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { Pencil, Plus, Shield } from 'lucide-react';
import { can, useSession } from '@/shared/auth/session';
import { P } from '@/shared/auth/permissions';
import { useDepartments, useSitesReference } from '@/shared/api/reference';
import { isApiError } from '@/shared/api/problem';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader, PageSkeleton } from '@/shared/ui/surfaces';
import { StatusPill, Badge } from '@/shared/ui/Badge';
import { Button, Checkbox } from '@/shared/ui/controls';
import { Dialog } from '@/shared/ui/overlays';
import { ErrorSummary, Field } from '@/shared/ui/controls';
import { TextField, Select, TextArea } from '@/shared/ui/controls';
import { CompactTable } from '@/shared/ui/data/CompactTable';
import { ErrorState } from '@/shared/ui/states';
import { toast } from '@/shared/ui/toast';
import { useCreateUser, useRoles, useUpdateUser, useUsers, type ManagedUser, type UserInput } from './api';

const ROLE_KEYS: UserInput['role'][] = [
  'system_administrator',
  'operations_manager',
  'site_manager',
  'storekeeper',
  'executive_viewer',
];

export function AdminPage() {
  const location = useLocation();
  const session = useSession();
  const isRolesTab = location.pathname.endsWith('/roles');
  const users = useUsers();
  const roles = useRoles();
  const [creating, setCreating] = useState(false);

  if (!can(session.data, P.userManage)) {
    return (
      <div className="py-16 text-center">
        <Shield aria-hidden className="mx-auto mb-3 size-8 text-faint" />
        <p className="text-sm font-medium text-ink">Access restricted</p>
        <p className="mt-1 text-sm text-muted">User and role management requires the System Administrator role.</p>
      </div>
    );
  }

  if (users.isPending || roles.isPending) return <PageSkeleton />;
  if (users.isError) return <ErrorState error={users.error} onRetry={() => void users.refetch()} />;
  if (roles.isError) return <ErrorState error={roles.error} onRetry={() => void roles.refetch()} />;

  return (
    <div>
      <PageHeader
        title={isRolesTab ? 'Roles' : 'Users'}
        description={isRolesTab ? 'Protected role definitions and their effective permissions.' : 'Manage employee work profiles, access, site scope, status, and password resets.'}
        actions={!isRolesTab && <Button variant="primary" onClick={() => setCreating(true)}><Plus aria-hidden className="size-4" /> New user</Button>}
      />
      {isRolesTab ? (
        <div className="space-y-4">
          {roles.data.map((role) => (
            <Card key={role.id}>
              <CardHeader title={role.name} description={role.isSystemRole ? 'Protected system role' : 'Custom role'} />
              <div className="flex flex-wrap gap-1 p-4 pt-0">
                {role.permissions.map((permission) => <Badge key={permission} tone="neutral">{permission}</Badge>)}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader title="User access" description="Changes are effective on the user’s next request." />
          <CompactTable label="Portal users">
              <thead className="bg-sunken text-left"><tr>{['User', 'Role', 'Site access', 'Status', 'Actions'].map((heading) => <th key={heading} className="border-b border-line px-4 py-2 text-xs font-semibold uppercase">{heading}</th>)}</tr></thead>
              <tbody>{users.data.map((user) => <UserRow key={user.id} user={user} currentUserId={session.data?.id ?? ''} />)}</tbody>
          </CompactTable>
        </Card>
      )}
      <CreateUserDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function UserRow({ user, currentUserId }: { user: ManagedUser; currentUserId: string }) {
  const update = useUpdateUser(user.id);
  const [editing, setEditing] = useState(false);
  const roleName = user.roles[0]?.name ?? 'No role';
  const roleKey = String(user.roles[0]?.id ?? '').replace(/^role-/, '') as UserInput['role'];
  const toggle = () => {
    update.mutate(
      { version: user.version, status: user.status === 'active' ? 'inactive' : 'active' },
      { onSuccess: () => toast('success', user.status === 'active' ? 'User deactivated' : 'User activated') },
    );
  };
  return (
    <tr>
      <td className="border-b border-line px-4 py-3"><p className="font-medium">{user.preferredName || user.name}</p><p className="text-xs text-muted">{user.jobTitle || user.email}</p><p className="text-xs text-faint">{user.email}</p></td>
      <td className="border-b border-line px-4 py-3">
        <Select
          aria-label={`Role for ${user.name}`}
          value={roleKey}
          disabled={update.isPending}
          onValueChange={(value) => update.mutate({ version: user.version, role: value as UserInput['role'] })}
          options={ROLE_KEYS.map((role) => ({ value: role, label: role.replaceAll('_', ' ') }))}
        />
        <span className="sr-only">{roleName}</span>
      </td>
      <td className="border-b border-line px-4 py-3">{user.allSites ? 'All sites' : `${user.assignedSiteIds.length} assigned`}</td>
      <td className="border-b border-line px-4 py-3"><StatusPill status={user.status} /></td>
      <td className="border-b border-line px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setEditing(true)}><Pencil aria-hidden className="size-3.5" />Edit profile</Button>
          <Button size="sm" disabled={user.id === currentUserId || update.isPending} onClick={toggle}>{user.status === 'active' ? 'Deactivate' : 'Activate'}</Button>
        </div>
        <EditWorkProfileDialog user={user} open={editing} onOpenChange={setEditing} />
      </td>
    </tr>
  );
}

function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const sites = useSitesReference();
  const departments = useDepartments();
  const create = useCreateUser();
  const [name, setName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [role, setRole] = useState<UserInput['role']>('storekeeper');
  const [allSites, setAllSites] = useState(false);
  const [assignedSiteIds, setAssignedSiteIds] = useState<string[]>([]);
  const errors = [
    ...(!name.trim() ? ['Enter the user name.'] : []),
    ...(!email.includes('@') ? ['Enter a valid email address.'] : []),
    ...(workPhone && !PHONE_PATTERN.test(workPhone) ? ['Enter a valid work phone number.'] : []),
    ...(temporaryPassword.length < 12 ? ['Temporary password must contain at least 12 characters.'] : []),
    ...(!allSites && assignedSiteIds.length === 0 ? ['Assign at least one site or enable all-site access.'] : []),
  ];
  const apiErrors = isApiError(create.error) ? [create.error.problem.detail ?? 'Could not create the user.'] : [];
  const submit = () => {
    if (errors.length > 0) return;
    create.mutate(
      {
        name: name.trim(),
        preferredName: preferredName.trim() || null,
        workPhone: workPhone.trim() || null,
        jobTitle: jobTitle.trim() || null,
        departmentCode: departmentCode || null,
        bio: bio.trim() || null,
        email: email.trim(),
        temporaryPassword,
        role,
        allSites,
        assignedSiteIds: allSites ? [] : assignedSiteIds,
      },
      { onSuccess: () => { toast('success', 'User created'); onOpenChange(false); } },
    );
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="New user" description="Create access with an explicit role and site scope." footer={<><Button onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" loading={create.isPending} onClick={submit}>Create user</Button></>}>
      <div className="space-y-3">
        {apiErrors.length > 0 && <ErrorSummary errors={apiErrors} />}
        <Field label="Name" required><TextField value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Preferred name"><TextField value={preferredName} maxLength={80} onChange={(event) => setPreferredName(event.target.value)} /></Field>
          <Field label="Work phone"><TextField value={workPhone} maxLength={32} onChange={(event) => setWorkPhone(event.target.value)} /></Field>
          <Field label="Job title"><TextField value={jobTitle} maxLength={120} onChange={(event) => setJobTitle(event.target.value)} /></Field>
          <Field label="Department"><Select value={departmentCode} onValueChange={setDepartmentCode} clearable placeholder="Not assigned" options={(departments.data ?? []).map((department) => ({ value: department.code, label: department.name }))} /></Field>
        </div>
        <Field label="Biography" hint={`${bio.length}/500 characters`}><TextArea value={bio} maxLength={500} rows={3} onChange={(event) => setBio(event.target.value)} /></Field>
        <Field label="Email" required><TextField type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
        <Field label="Temporary password" required hint="At least 12 characters"><TextField type="password" value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} /></Field>
        <Field label="Role" required><Select value={role} onValueChange={(value) => setRole(value as UserInput['role'])} options={ROLE_KEYS.map((value) => ({ value, label: value.replaceAll('_', ' ') }))} /></Field>
        <Checkbox checked={allSites} onCheckedChange={setAllSites} label="Access all sites" />
        {!allSites && <fieldset className="space-y-2"><legend className="text-sm font-medium">Assigned sites</legend>{sites.data?.map((site) => <Checkbox key={site.id} label={site.name} checked={assignedSiteIds.includes(site.id)} onCheckedChange={(checked) => setAssignedSiteIds((current) => checked ? [...current, site.id] : current.filter((id) => id !== site.id))} />)}</fieldset>}
        {errors.length > 0 && <ErrorSummary errors={errors} />}
      </div>
    </Dialog>
  );
}

const PHONE_PATTERN = /^\+?[0-9 ()-]{7,32}$/;

function EditWorkProfileDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ManagedUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const departments = useDepartments();
  const update = useUpdateUser(user.id);
  const [name, setName] = useState(user.name);
  const [preferredName, setPreferredName] = useState(user.preferredName ?? '');
  const [workPhone, setWorkPhone] = useState(user.workPhone ?? '');
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? '');
  const [departmentCode, setDepartmentCode] = useState(user.departmentCode ?? '');
  const [bio, setBio] = useState(user.bio ?? '');

  useEffect(() => {
    if (!open) return;
    setName(user.name);
    setPreferredName(user.preferredName ?? '');
    setWorkPhone(user.workPhone ?? '');
    setJobTitle(user.jobTitle ?? '');
    setDepartmentCode(user.departmentCode ?? '');
    setBio(user.bio ?? '');
  }, [open, user]);

  const errors = [
    ...(!name.trim() ? ['Enter the user’s full name.'] : []),
    ...(name.length > 120 ? ['Full name cannot exceed 120 characters.'] : []),
    ...(preferredName.length > 80 ? ['Preferred name cannot exceed 80 characters.'] : []),
    ...(workPhone && !PHONE_PATTERN.test(workPhone) ? ['Enter a valid work phone number.'] : []),
    ...(jobTitle.length > 120 ? ['Job title cannot exceed 120 characters.'] : []),
    ...(bio.length > 500 ? ['Biography cannot exceed 500 characters.'] : []),
  ];
  const apiErrors = isApiError(update.error) ? [update.error.problem.detail ?? 'Could not update the work profile.'] : [];
  const submit = () => {
    if (errors.length > 0) return;
    update.mutate(
      {
        version: user.version,
        name: name.trim(),
        preferredName: preferredName.trim() || null,
        workPhone: workPhone.trim() || null,
        jobTitle: jobTitle.trim() || null,
        departmentCode: departmentCode || null,
        bio: bio.trim() || null,
      },
      {
        onSuccess: () => {
          toast('success', 'Work profile updated');
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit work profile"
      description={`Maintain employment details for ${user.email}. Login email, role, status, and site access are unchanged.`}
      footer={<><Button onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" loading={update.isPending} onClick={submit}>Save profile</Button></>}
    >
      <div className="space-y-3">
        {apiErrors.length > 0 && <ErrorSummary errors={apiErrors} />}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" required><TextField value={name} maxLength={120} onChange={(event) => setName(event.target.value)} /></Field>
          <Field label="Preferred name"><TextField value={preferredName} maxLength={80} onChange={(event) => setPreferredName(event.target.value)} /></Field>
          <Field label="Work phone"><TextField value={workPhone} maxLength={32} onChange={(event) => setWorkPhone(event.target.value)} /></Field>
          <Field label="Job title"><TextField value={jobTitle} maxLength={120} onChange={(event) => setJobTitle(event.target.value)} /></Field>
        </div>
        <Field label="Department"><Select value={departmentCode} onValueChange={setDepartmentCode} clearable placeholder="Not assigned" options={(departments.data ?? []).map((department) => ({ value: department.code, label: department.name }))} /></Field>
        <Field label="Biography" hint={`${bio.length}/500 characters`}><TextArea value={bio} maxLength={500} rows={4} onChange={(event) => setBio(event.target.value)} /></Field>
        {errors.length > 0 && <ErrorSummary errors={errors} />}
      </div>
    </Dialog>
  );
}
