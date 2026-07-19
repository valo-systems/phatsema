import { describe, expect, it } from 'vitest';
import {
  decAdd,
  decCompare,
  decSub,
  formatDec,
  isPositiveDec,
  isValidQuantity,
  parseDec,
} from './dec';

describe('decimal quantities', () => {
  it('parses quantities into scaled integers without float drift', () => {
    expect(parseDec('0.1')).toBe(100n);
    expect(parseDec('12.345')).toBe(12_345n);
    expect(parseDec('-2.5')).toBe(-2_500n);
  });

  it('adds and subtracts exact decimal strings', () => {
    expect(decAdd('0.1', '0.2')).toBe('0.3');
    expect(decSub('10.005', '0.005')).toBe('10');
  });

  it('compares and formats scaled values', () => {
    expect(decCompare('1.001', '1.01')).toBe(-1);
    expect(formatDec(-12_340n)).toBe('-12.34');
  });

  it('validates contract quantities', () => {
    expect(isValidQuantity('12.345')).toBe(true);
    expect(isPositiveDec('0.001')).toBe(true);
    expect(isValidQuantity('-1')).toBe(false);
    expect(isValidQuantity('1.2345')).toBe(false);
    expect(isPositiveDec('not-a-number')).toBe(false);
    expect(parseDec('1.2345')).toBeNull();
  });

  it('rejects invalid arithmetic operands', () => {
    expect(() => decAdd('bad', '1')).toThrow('Invalid decimal input');
    expect(() => decSub('1', 'bad')).toThrow('Invalid decimal input');
    expect(() => decCompare('bad', '1')).toThrow('Invalid decimal input');
  });
});
