import { describe, expect, it } from 'vitest';
import { validatePasswordChange, validatePersonalProfile } from './validation';

describe('profile validation', () => {
  it('accepts a complete personal work profile', () => {
    expect(validatePersonalProfile({
      name: 'Demo User',
      preferredName: 'Demo',
      workPhone: '+27 12 555 0101',
      bio: 'Inventory operations.',
    })).toEqual([]);
  });

  it('reports invalid personal fields together', () => {
    const errors = validatePersonalProfile({
      name: ' ',
      preferredName: 'x'.repeat(81),
      workPhone: 'call me',
      bio: 'x'.repeat(501),
    });
    expect(errors).toHaveLength(4);
  });

  it('enforces password length, confirmation, and non-reuse', () => {
    expect(validatePasswordChange({
      currentPassword: 'same-password',
      newPassword: 'same-password',
      newPasswordConfirmation: 'different-password',
    })).toEqual([
      'New password must differ from your current password.',
      'New password confirmation does not match.',
    ]);
    expect(validatePasswordChange({
      currentPassword: '',
      newPassword: 'short',
      newPasswordConfirmation: 'short',
    })).toHaveLength(2);
    expect(validatePasswordChange({
      currentPassword: 'existing-password',
      newPassword: 'x'.repeat(101),
      newPasswordConfirmation: 'x'.repeat(101),
    })).toEqual(['New password cannot exceed 100 characters.']);
  });
});
