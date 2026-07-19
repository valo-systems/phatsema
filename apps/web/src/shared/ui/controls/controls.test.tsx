import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select, MultiSelect } from './Select';
import { NumberField } from './NumberField';
import { Checkbox, Switch } from './Toggles';
import { SegmentedControl } from './SegmentedControl';
import { Field } from './Field';
import { TextField } from './TextField';

const SITES = [
  { value: 'site-1', label: 'Gaborone Main Depot' },
  { value: 'site-2', label: 'Francistown Workshop' },
  { value: 'site-3', label: 'Selebi Phikwe Yard', disabled: true },
];

function ControlledSelect({ onChange }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <Select
      aria-label="Site"
      options={SITES}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

/*
 * Zag (Ark's engine) drives selection through pointer-capture and layout APIs
 * that jsdom does not implement, so option picking is verified in Playwright
 * against a real browser. What is asserted here is the contract jsdom can see
 * honestly: roles, accessible names, ARIA state and focus order.
 */
describe('Select', () => {
  it('exposes a combobox with an accessible name', () => {
    render(<ControlledSelect />);

    expect(screen.getByRole('combobox', { name: 'Site' })).toBeInTheDocument();
  });

  it('is reachable by keyboard', async () => {
    render(<ControlledSelect />);

    await userEvent.tab();

    expect(screen.getByRole('combobox', { name: 'Site' })).toHaveFocus();
  });

  it('advertises its listbox popup to assistive technology', () => {
    render(<ControlledSelect />);
    const trigger = screen.getByRole('combobox', { name: 'Site' });

    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the placeholder until a value is chosen', () => {
    render(<Select aria-label="Site" options={SITES} value="" onValueChange={() => {}} placeholder="All sites" />);

    expect(screen.getByRole('combobox', { name: 'Site' })).toHaveTextContent('All sites');
  });

  it('shows the selected label once a value is set', () => {
    render(<Select aria-label="Site" options={SITES} value="site-2" onValueChange={() => {}} />);

    expect(screen.getByRole('combobox', { name: 'Site' })).toHaveTextContent('Francistown Workshop');
  });

  it('reflects the invalid state for form validation', () => {
    render(<Select aria-label="Site" options={SITES} value="" onValueChange={() => {}} invalid />);

    expect(screen.getByRole('combobox', { name: 'Site' })).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('MultiSelect', () => {
  it('summarises the count once more than one option is chosen', () => {
    render(
      <MultiSelect aria-label="Health" options={SITES} value={['site-1', 'site-2']} onValueChange={() => {}} />,
    );

    expect(screen.getByRole('combobox', { name: 'Health' })).toHaveTextContent('2 selected');
  });

  it('falls back to the placeholder when nothing is selected', () => {
    render(<MultiSelect aria-label="Health" options={SITES} value={[]} onValueChange={() => {}} placeholder="Any" />);

    expect(screen.getByRole('combobox', { name: 'Health' })).toHaveTextContent('Any');
  });

  it('names the single selection rather than counting it', () => {
    render(<MultiSelect aria-label="Health" options={SITES} value={['site-2']} onValueChange={() => {}} />);

    expect(screen.getByRole('combobox', { name: 'Health' })).toHaveTextContent('Francistown Workshop');
  });
});

describe('NumberField', () => {
  it('keeps quantities as strings so decimals never round-trip through floats', async () => {
    const onChange = vi.fn();
    render(<NumberField aria-label="Quantity" value="" onValueChange={onChange} unit="L" />);

    await userEvent.type(screen.getByRole('spinbutton', { name: 'Quantity' }), '12.5');

    expect(onChange).toHaveBeenLastCalledWith('12.5');
  });

  it('renders the unit inside the control', () => {
    render(<NumberField aria-label="Quantity" value="1" onValueChange={() => {}} unit="L" />);

    expect(screen.getByText('L')).toBeInTheDocument();
  });

  it('exposes labelled steppers', () => {
    render(<NumberField aria-label="Quantity" value="1" onValueChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Increase' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeInTheDocument();
  });

  it('refuses negative stock by defaulting the minimum to zero', () => {
    render(<NumberField aria-label="Quantity" value="0" onValueChange={() => {}} />);

    expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toHaveAttribute('aria-valuemin', '0');
  });
});

describe('Toggles', () => {
  it('checkbox toggles by keyboard', async () => {
    const onChange = vi.fn();
    render(<Checkbox checked={false} onCheckedChange={onChange} label="Blind count" />);

    await userEvent.tab();
    await userEvent.keyboard(' ');

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('switch exposes its label and checked state', () => {
    render(<Switch checked onCheckedChange={() => {}} label="Compact rows" />);

    expect(screen.getByRole('checkbox', { name: 'Compact rows' })).toBeChecked();
  });
});

describe('SegmentedControl', () => {
  it('reports the active segment', () => {
    render(
      <SegmentedControl
        aria-label="Density"
        value="compact"
        onValueChange={() => {}}
        options={[
          { value: 'compact', label: 'Compact' },
          { value: 'standard', label: 'Standard' },
        ]}
      />,
    );

    expect(screen.getByRole('radio', { name: 'Compact' })).toBeChecked();
  });
});

describe('Field', () => {
  it('links label, hint and error to the control', () => {
    render(
      <Field label="Recipient" required hint="Person receiving the stock" error="Enter the recipient">
        <TextField />
      </Field>,
    );

    const input = screen.getByRole('textbox', { name: /Recipient/ });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(/Enter the recipient/);
  });
});
