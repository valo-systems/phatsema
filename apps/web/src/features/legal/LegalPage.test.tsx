import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { LegalPage } from './LegalPage';

function renderLegalPage(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/legal/:documentType',
        Component: LegalPage,
      },
    ],
    { initialEntries: [path] },
  );

  return render(<RouterProvider router={router} />);
}

describe('LegalPage', () => {
  it('publishes the portal privacy notice without authentication', () => {
    renderLegalPage('/legal/privacy');

    expect(screen.getByRole('heading', { name: 'Privacy notice' })).toBeVisible();
    expect(screen.getByText('Who is responsible for your information')).toBeVisible();
    expect(screen.getByText(/responsible legal entity.*must be confirmed/i)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Acceptable use' })).toHaveAttribute(
      'href',
      '/legal/acceptable-use',
    );
  });

  it('publishes PAIA guidance and official information', () => {
    renderLegalPage('/legal/paia');

    expect(screen.getByRole('heading', { name: 'PAIA access to information' })).toBeVisible();
    expect(screen.getByRole('link', { name: /official PAIA information/i })).toHaveAttribute(
      'href',
      'https://inforegulator.org.za/paia/',
    );
  });
});
