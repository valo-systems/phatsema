/**
 * Decimal-safe arithmetic over quantity strings (max 3 dp), mirroring the API contract.
 * Quantities travel as strings end to end; no binary floats.
 */
const SCALE = 1000n;

export function parseDec(value: string): bigint | null {
  const match = /^(-?)(\d{1,12})(?:\.(\d{1,3}))?$/.exec(value.trim());
  if (!match) return null;
  const sign = match[1] === '-' ? -1n : 1n;
  const whole = BigInt(match[2] ?? '0');
  const frac = BigInt((match[3] ?? '').padEnd(3, '0') || '0');
  return sign * (whole * SCALE + frac);
}

export function formatDec(scaled: bigint, precision = 3): string {
  const negative = scaled < 0n;
  const abs = negative ? -scaled : scaled;
  const whole = abs / SCALE;
  const frac = (abs % SCALE).toString().padStart(3, '0');
  const trimmed = precision === 0 ? '' : frac.slice(0, precision).replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${trimmed ? `.${trimmed}` : ''}`;
}

export function decAdd(a: string, b: string): string {
  const pa = parseDec(a);
  const pb = parseDec(b);
  if (pa === null || pb === null) throw new Error('Invalid decimal input');
  return formatDec(pa + pb);
}

export function decSub(a: string, b: string): string {
  const pa = parseDec(a);
  const pb = parseDec(b);
  if (pa === null || pb === null) throw new Error('Invalid decimal input');
  return formatDec(pa - pb);
}

export function decCompare(a: string, b: string): -1 | 0 | 1 {
  const pa = parseDec(a);
  const pb = parseDec(b);
  if (pa === null || pb === null) throw new Error('Invalid decimal input');
  return pa < pb ? -1 : pa > pb ? 1 : 0;
}

export function isPositiveDec(value: string): boolean {
  const parsed = parseDec(value);
  return parsed !== null && parsed > 0n;
}

/** Validates against the contract's Quantity pattern (non-negative, ≤3 dp). */
export function isValidQuantity(value: string): boolean {
  return /^\d{1,10}(\.\d{1,3})?$/.test(value.trim());
}
