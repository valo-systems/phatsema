import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { Button, LinkButton } from './Button';

describe('Button', () => {
  it('is keyboard operable', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Post receipt</Button>);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('prevents actions while loading', () => {
    render(<Button loading>Saving</Button>);

    expect(screen.getByRole('button', { name: 'Saving' })).toBeDisabled();
  });

  it('renders an accessible router link with button styling', () => {
    render(
      <MemoryRouter>
        <LinkButton to="/inventory">Inventory</LinkButton>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Inventory' })).toHaveAttribute('href', '/inventory');
  });
});
