import { describe, expect, it } from 'vitest';
import { ApiError, isApiError, problemFromUnknown } from './problem';

describe('Problem Details handling', () => {
  it('preserves status and field errors', () => {
    const error = new ApiError({
      type: 'validation',
      title: 'Invalid',
      status: 422,
      errors: { quantity: ['Must be positive'] },
    });

    expect(isApiError(error)).toBe(true);
    expect(error.status).toBe(422);
    expect(error.fieldErrors.quantity).toEqual(['Must be positive']);
  });

  it('normalises unknown errors', () => {
    expect(problemFromUnknown(new Error('offline')).detail).toBe('offline');
    expect(problemFromUnknown('unknown').status).toBe(0);
  });

  it('uses the problem title when no detail is supplied', () => {
    const error = new ApiError({ type: 'forbidden', title: 'Forbidden', status: 403 });

    expect(error.message).toBe('Forbidden');
    expect(error.fieldErrors).toEqual({});
    expect(problemFromUnknown(error)).toBe(error.problem);
  });
});
