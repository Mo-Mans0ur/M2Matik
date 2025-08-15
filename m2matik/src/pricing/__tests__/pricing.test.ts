import { describe, it, expect } from 'vitest';
import { baseTotal, extrasTotal, total, type JsonPrice } from '../json';

const MALING: JsonPrice = { startpris: 5000, m2pris: 1400, faktorLav: 0.6, faktorNormal: 1, faktorHøj: 1.4 };

describe('calculators', () => {
  it('baseTotal matches Excel control for Maling 80 m² low (0.6) = 72,200 kr', () => {
    const res = baseTotal(MALING, 80, 'lav', 'maling');
    expect(res).toBe(72200);
  });

  it('extrasTotal sums fixed and per_m2 correctly', () => {
    const list = [
      { name: 'Foo', kind: 'fixed' as const, amount: 1000 },
      { name: 'Bar', kind: 'per_m2' as const, amount: 50 },
    ];
    const sum = extrasTotal(list, 10, ['foo', 'bar']);
    expect(sum).toBe(1000 + 50 * 10);
  });

  it('total adds up base and extras', () => {
    expect(total(100, 25)).toBe(125);
  });
});
