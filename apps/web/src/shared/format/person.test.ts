import { describe, expect, it } from 'vitest';
import { displayName, initials } from './person';

describe('person formatting', () => {
  it('prefers the preferred name for labels and initials', () => {
    expect(displayName({ name: 'Thabo Mokoena', preferredName: 'TK Mokoena' })).toBe('TK Mokoena');
    expect(initials({ name: 'Thabo Mokoena', preferredName: 'TK Mokoena' })).toBe('TM');
  });

  it('falls back to the full name and handles one-word names', () => {
    expect(displayName({ name: 'Storekeeper', preferredName: null })).toBe('Storekeeper');
    expect(initials({ name: 'Storekeeper' })).toBe('ST');
    expect(initials({ name: ' ' })).toBe('?');
  });
});
