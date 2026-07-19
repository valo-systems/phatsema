import { expect, test, type Page } from '@playwright/test';

const SITE_A = '01JZABC001GABORONE0000001';
const SITE_B = '01JZABC002FRANCIST0000002';
const LOCATION_A = '01JZLOC001GAB0000000000001';
const LOCATION_B = '01JZLOC005FRA0000000000005';
const ITEM_A = '01JZITM0000000000000000001';

interface ApiResult<T> {
  status: number;
  body: T;
}

async function loginAs(page: Page, persona = 'System Administrator') {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Demo personas' }).click();
  await page.getByRole('button', { name: new RegExp(`^${persona}`) }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Operations dashboard' })).toBeVisible();
}

async function api<T>(
  page: Page,
  path: string,
  method: 'GET' | 'POST' | 'PATCH' = 'GET',
  body?: unknown,
): Promise<ApiResult<T>> {
  return page.evaluate(
    async ({ requestPath, requestMethod, requestBody }) => {
      const token = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
        ?.split('=')
        .slice(1)
        .join('=');
      const response = await fetch(`/api/v1${requestPath}`, {
        method: requestMethod,
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}),
        },
        ...(requestBody === undefined ? {} : { body: JSON.stringify(requestBody) }),
      });

      const responseBody = response.status === 204 ? null : await response.json();

      return { status: response.status, body: responseBody };
    },
    { requestPath: path, requestMethod: method, requestBody: body },
  );
}

test('1: authenticates every demo persona and preserves role identity', async ({ page }) => {
  const personas = [
    ['System Administrator', 'system_administrator'],
    ['Operations Manager', 'operations_manager'],
    ['Site Manager', 'site_manager'],
    ['Storekeeper', 'storekeeper'],
    ['Executive Viewer', 'executive_viewer'],
  ] as const;

  await page.goto('/login');
  const personaToggle = page.getByRole('button', { name: 'Demo personas' });
  await expect(personaToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: /^System Administrator/ })).toBeHidden();
  await personaToggle.click();
  await expect(personaToggle).toHaveAttribute('aria-expanded', 'true');
  const administratorPersona = page.getByRole('button', { name: /^System Administrator/ });
  await expect(administratorPersona).toBeVisible();
  await administratorPersona.click();
  await expect(page.getByLabel('Email address')).toHaveValue('admin@demo.phatsema.example');
  await expect(page.locator('input[name="password"]')).toHaveValue('PhatsemaDemo1');
  await expect(personaToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(administratorPersona).toBeHidden();

  const password = page.locator('input[name="password"]');
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(password).toHaveValue('PhatsemaDemo1');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(password).toHaveAttribute('type', 'password');

  for (const [persona, role] of personas) {
    await loginAs(page, persona);
    const current = await api<{ data: { roles: Array<{ id: string }> } }>(page, '/auth/me');
    expect(current.status).toBe(200);
    expect(current.body.data.roles[0]?.id).toBe(`role-${role}`);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Operations dashboard' })).toBeVisible();
    if ((page.viewportSize()?.width ?? 1280) < 640) {
      await expect(page.getByText('Demo data · fictional records · session-scoped changes', { exact: true })).toBeVisible();
    } else {
      await expect(page.getByText('Demo data', { exact: true })).toBeVisible();
    }
    expect((await api(page, '/auth/logout', 'POST')).status).toBe(204);
  }
});

test('2: rejects invalid credentials without leaking account details', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@demo.phatsema.example');
  await page.locator('input[name="password"]').fill('incorrect-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Sign-in failed')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('3: enforces read-only persona permissions in the UI and API', async ({ page }) => {
  await loginAs(page, 'Executive Viewer');
  await expect(page.getByRole('link', { name: /Receive stock/ })).toHaveCount(0);
  const result = await api<{ status: number }>(page, '/adjustments', 'POST', {
    siteId: SITE_A,
    locationId: LOCATION_A,
    itemId: ITEM_A,
    direction: 'increase',
    quantity: '1.00',
    reasonCode: 'RSN-CORR',
  });
  expect(result.status).toBe(403);
});

test('4: supports responsive navigation and direct nested-route refresh', async ({ page }) => {
  await loginAs(page);
  await page.goto('/inventory/balances');
  await page.reload();
  await expect(page.getByRole('heading', { name: /Stock balances/i })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator('main')).toBeVisible();
});

test('5: finds an item and exposes its site balances and movement history', async ({ page }) => {
  await loginAs(page);
  await page.goto(`/inventory/items/${ITEM_A}`);
  await expect(page.getByRole('heading', { name: 'Hydraulic Fluid ISO 46' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Balance by site and location' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent movements' })).toBeVisible();
});

test('6: posts a receipt and reconciles the balance and immutable ledger', async ({ page }) => {
  await loginAs(page);
  const before = await api<{ data: Array<{ onHand: string }> }>(
    page,
    `/balances?siteId=${SITE_A}&locationId=${LOCATION_A}&itemId=${ITEM_A}`,
  );
  const result = await api<{ data: Array<{ referenceNumber: string }> }>(page, '/receipts', 'POST', {
    siteId: SITE_A,
    locationId: LOCATION_A,
    reference: 'DEMO-E2E-RECEIPT',
    receivedAt: new Date().toISOString().slice(0, 10),
    lines: [{ itemId: ITEM_A, quantity: '2.25' }],
  });
  expect(result.status).toBe(201);
  expect(result.body.data[0]?.referenceNumber).toMatch(/^DEMO-RCT/);
  const after = await api<{ data: Array<{ onHand: string }> }>(
    page,
    `/balances?siteId=${SITE_A}&locationId=${LOCATION_A}&itemId=${ITEM_A}`,
  );
  expect(Number(after.body.data[0]?.onHand) - Number(before.body.data[0]?.onHand)).toBe(2.25);
  await page.goto('/inventory/movements');
  const referenceNumber = result.body.data[0]!.referenceNumber;
  if ((page.viewportSize()?.width ?? 1280) < 768) {
    await page.getByRole('list', { name: 'Inventory movement ledger' }).getByRole('listitem').first().click();
  } else {
    await page.locator('tbody tr').filter({ hasText: referenceNumber }).click();
  }
  await expect(page.getByRole('dialog').getByText(referenceNumber)).toBeVisible();
});

test('7: posts an available issue and prevents an issue that would create negative stock', async ({ page }) => {
  await loginAs(page);
  const issued = await api<{ data: Array<{ movementType: string }> }>(page, '/issues', 'POST', {
    siteId: SITE_A,
    locationId: LOCATION_A,
    purpose: 'maintenance',
    recipient: 'DEMO-E2E Team',
    lines: [{ itemId: ITEM_A, quantity: '1.25' }],
  });
  expect(issued.status).toBe(201);
  expect(issued.body.data[0]?.movementType).toBe('issue');

  const result = await api<{ type: string }>(page, '/issues', 'POST', {
    siteId: SITE_A,
    locationId: LOCATION_A,
    purpose: 'maintenance',
    recipient: 'DEMO-E2E Team',
    lines: [{ itemId: ITEM_A, quantity: '99999.00' }],
  });
  expect(result.status).toBe(422);
  expect(result.body.type).toContain('insufficient-stock');
});

test('8: completes a transfer lifecycle and records a receipt discrepancy', async ({ page }) => {
  await loginAs(page);
  const created = await api<{ data: { id: string; lines: Array<{ id: string }> } }>(page, '/transfers', 'POST', {
    sourceSiteId: SITE_A,
    sourceLocationId: LOCATION_A,
    destinationSiteId: SITE_B,
    destinationLocationId: LOCATION_B,
    lines: [{ itemId: ITEM_A, requestedQuantity: '2.00' }],
  });
  expect(created.status).toBe(201);
  const id = created.body.data.id;
  const lineId = created.body.data.lines[0]!.id;
  expect((await api(page, `/transfers/${id}/submit`, 'POST', { version: 1 })).status).toBe(200);
  expect((await api(page, '/auth/logout', 'POST')).status).toBe(204);
  await loginAs(page, 'Operations Manager');
  expect((await api(page, `/transfers/${id}/approve`, 'POST', { version: 2 })).status).toBe(200);
  expect((await api(page, `/transfers/${id}/dispatch`, 'POST', {
    version: 3,
    lines: [{ lineId, dispatchedQuantity: '2.00' }],
  })).status).toBe(200);
  const received = await api<{ data: { status: string; hasDiscrepancy: boolean } }>(page, `/transfers/${id}/receive`, 'POST', {
    version: 4,
    lines: [{
      lineId,
      receivedQuantity: '1.50',
      rejectedQuantity: '0.50',
      discrepancyReason: 'DEMO transit variance',
    }],
  });
  expect(received.body.data.status).toBe('received');
  expect(received.body.data.hasDiscrepancy).toBe(true);
});

test('9: completes a blind stock count with review and posting', async ({ page }) => {
  await loginAs(page);
  const created = await api<{ data: { id: string; entries: Array<{ id: string }> } }>(page, '/counts', 'POST', {
    siteId: SITE_A,
    locationId: LOCATION_A,
    scope: 'selected_items',
    scopeItemIds: [ITEM_A],
    blindCount: true,
  });
  expect(created.status).toBe(201);
  const id = created.body.data.id;
  const entryId = created.body.data.entries[0]!.id;
  expect((await api(page, `/counts/${id}/start`, 'POST', { version: 1 })).status).toBe(200);
  expect((await api(page, `/counts/${id}/entries`, 'POST', {
    version: 2,
    entries: [{ entryId, countedQuantity: '245.00' }],
  })).status).toBe(200);
  expect((await api(page, `/counts/${id}/submit`, 'POST', { version: 3 })).status).toBe(200);
  expect((await api(page, '/auth/logout', 'POST')).status).toBe(204);
  await loginAs(page, 'Operations Manager');
  expect((await api(page, `/counts/${id}/approve`, 'POST', { version: 4, note: 'DEMO E2E variance reviewed' })).status).toBe(200);
  const posted = await api<{ data: { status: string } }>(page, `/counts/${id}/post`, 'POST', { version: 5 });
  expect(posted.body.data.status).toBe('posted');
});

test('10: registers, assigns, and meters a controlled asset', async ({ page }) => {
  await loginAs(page);
  const created = await api<{ data: { id: string } }>(page, '/assets', 'POST', {
    assetNumber: 'DEMO-E2E-AST',
    name: 'DEMO E2E Compressor',
    type: 'workshop_equipment',
    ownershipMode: 'company_owned',
    make: 'DEMO',
    model: 'E2E',
    serialNumber: 'DEMO-E2E-SERIAL',
    siteId: SITE_A,
    locationId: LOCATION_A,
    meterType: 'hours',
    meterReading: '10.00',
  });
  const id = created.body.data.id;
  expect((await api(page, `/assets/${id}/assign`, 'POST', {
    version: 1,
    siteId: SITE_A,
    locationId: LOCATION_A,
    assignedTo: 'DEMO E2E Operator',
  })).status).toBe(200);
  const metered = await api<{ data: { meterReading: string } }>(page, `/assets/${id}/meter-reading`, 'POST', {
    version: 2,
    reading: '12.50',
  });
  expect(metered.body.data.meterReading).toBe('12.50');
});

test('11: renders reports and supports an operational report view', async ({ page }) => {
  await loginAs(page);
  await page.goto('/reports');
  await expect(page.getByRole('heading', { name: /Reports/i })).toBeVisible();
  await expect(page.getByText(/Stock on hand/i).first()).toBeVisible();
  if ((page.viewportSize()?.width ?? 1280) < 768) {
    await expect(page.getByRole('list', { name: 'Stock on hand' }).getByText(/R\s?[\d,]+/).first()).toBeVisible();
  } else {
    await expect(page.getByRole('cell', { name: /R\s?[\d,]+/ }).first()).toBeVisible();
  }

  await page.getByRole('tab', { name: 'Movements' }).click();
  if ((page.viewportSize()?.width ?? 1280) < 768) {
    const movements = page.getByRole('list', { name: 'Movement summary' });
    await expect(movements.getByText('Receipt', { exact: true }).first()).toBeVisible();
    await expect(movements.getByText('Transfer dispatch', { exact: true }).first()).toBeVisible();
  } else {
    await expect(page.getByRole('cell', { name: 'Receipt', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Transfer dispatch', exact: true })).toBeVisible();
  }
  await expect(page.getByText('No movement data')).toHaveCount(0);
});

test('12: traces an activity into audit and resets the isolated demo session', async ({ page }) => {
  await loginAs(page);
  const adjustment = await api(page, '/adjustments', 'POST', {
    siteId: SITE_A,
    locationId: LOCATION_A,
    itemId: ITEM_A,
    direction: 'increase',
    quantity: '1.00',
    reasonCode: 'RSN-CORR',
    adjustedAt: new Date().toISOString(),
    notes: 'DEMO E2E audit',
  });
  expect(adjustment.status).toBe(201);
  await page.goto('/dashboard');
  await expect(page.getByText('Adjustment posted').first()).toBeVisible();
  await page.locator('#main-content').getByRole('link', { name: /Audit log/i }).click();
  await expect(page).toHaveURL(/\/audit$/);
  const audit = await api<{ data: Array<{ summary: string }> }>(page, '/audit-events');
  expect(audit.body.data.some((event) => event.summary.includes('Adjustment posted'))).toBe(true);
  expect((await api(page, '/demo/reset', 'POST')).status).toBe(200);
});

test('13: exposes all major module pages without production console failures', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await loginAs(page);
  for (const path of ['/sites', '/inventory/items', '/transfers', '/inventory/counts', '/assets', '/audit']) {
    await page.goto(path);
    await expect(page.locator('h1').first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('14: selects Ark options and a calendar date in a real browser', async ({ page }) => {
  await loginAs(page);
  await page.goto('/inventory/receive');

  const site = page.getByRole('combobox', { name: 'Site', exact: true });
  await site.click();
  await page.getByRole('option', { name: 'Gaborone Main Depot' }).click();
  await expect(site).toContainText('Gaborone Main Depot');

  const location = page.getByRole('combobox', { name: 'Location' });
  await location.click();
  await page.getByRole('option', { name: 'Main Store' }).click();
  await expect(location).toContainText('Main Store');

  const dateInput = page.getByRole('textbox', { name: 'Receipt date' });
  const originalDate = await dateInput.inputValue();
  await page.getByRole('button', { name: 'Open calendar' }).click();
  await expect(page.getByRole('button', { name: 'Previous month' })).toBeVisible();
  await page.getByRole('button', { name: 'Previous month' }).click();
  await page.locator('[data-scope="date-picker"][data-part="table-cell-trigger"][data-selectable]').first().click();
  await expect(dateInput).not.toHaveValue(originalDate);
});

test('15: keeps priority data usable without page overflow at supported widths', async ({ page }) => {
  await loginAs(page);

  for (const width of [360, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.goto('/transfers');
    await expect(page.getByRole('heading', { name: 'Transfers' })).toBeVisible();
    await expect(page.locator('main')).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      offenders: Array.from(document.querySelectorAll<HTMLElement>('*'))
        .map((element) => {
          const bounds = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            className: element.className,
            text: element.textContent?.trim().slice(0, 50),
            left: bounds.left,
            right: bounds.right,
          };
        })
        .filter((element) => element.left < -1 || element.right > document.documentElement.clientWidth + 1)
        .slice(0, 10),
    }));
    expect(
      dimensions.documentWidth,
      JSON.stringify(dimensions.offenders, null, 2),
    ).toBeLessThanOrEqual(dimensions.viewportWidth);

    if (width < 768) {
      await expect(page.getByRole('list', { name: 'Transfers' })).toBeVisible();
    } else {
      await expect(page.locator('table')).toBeVisible();
    }
  }
});

test('16: opens a scoped profile for every persona on desktop and mobile', async ({ page }) => {
  const personas = [
    'System Administrator',
    'Operations Manager',
    'Site Manager',
    'Storekeeper',
    'Executive Viewer',
  ];

  for (const persona of personas) {
    await loginAs(page, persona);
    await page.getByRole('button', { name: new RegExp(`User menu for ${persona}`) }).click();
    await page.getByRole('menuitem', { name: 'My profile' }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole('heading', { name: 'My profile' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeDisabled();
    await expect(page.getByRole('heading', { name: 'Employment' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Access' })).toBeVisible();
    expect((await api(page, '/auth/logout', 'POST')).status).toBe(204);
  }
});

test('17: persists personal details, changes a password, and supports administrator employment updates', async ({ page }) => {
  await loginAs(page);
  await page.getByRole('button', { name: /User menu for System Administrator/ }).click();
  await page.getByRole('menuitem', { name: 'My profile' }).click();

  await page.getByLabel('Preferred name').fill('Portal Admin');
  await page.getByLabel('Work phone').fill('+27 12 555 0166');
  await page.getByLabel('Biography').fill('Keeps the demonstration portal safe and easy to operate.');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile saved')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Preferred name')).toHaveValue('Portal Admin');

  await page.getByLabel('Current password').fill('PhatsemaDemo1');
  await page.locator('input[autocomplete="new-password"]').first().fill('E2E-profile-password-123');
  await page.locator('input[autocomplete="new-password"]').last().fill('E2E-profile-password-123');
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('Password changed', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'My profile' })).toBeVisible();

  await page.goto('/admin/users');
  const storekeeper = page.locator('tbody tr').filter({ hasText: 'storekeeper@demo.phatsema.example' });
  await storekeeper.getByRole('button', { name: 'Edit profile' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit work profile' });
  await dialog.getByLabel('Job title').fill('Senior Store Controller');
  const department = dialog.getByRole('combobox', { name: 'Department' });
  await department.click();
  await page.getByRole('option', { name: 'Maintenance' }).click();
  await dialog.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Work profile updated')).toBeVisible();
  await expect(storekeeper).toContainText('Senior Store Controller');
  const users = await api<{ data: Array<{ email: string; departmentCode: string | null }> }>(page, '/users');
  expect(users.body.data.find((user) => user.email === 'storekeeper@demo.phatsema.example')?.departmentCode).toBe('maintenance');
});
