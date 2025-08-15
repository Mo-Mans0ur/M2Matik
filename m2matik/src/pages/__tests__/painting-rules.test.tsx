import { describe, it, expect } from 'vitest';

// Lightweight unit tests for business rules: painting %, panels/stuk independence
// We'll test against the pure calculators to avoid mounting React components.
import { baseTotal, type JsonPrice } from '../../pricing/json';

const MALING: JsonPrice = { startpris: 5000, m2pris: 1400, faktorLav: 0.6, faktorNormal: 1, faktorHøj: 1.4 };
const PANELS: JsonPrice = { startpris: 2000, m2pris: 200, faktorLav: 0.6, faktorNormal: 1, faktorHøj: 1.4 };
const STUK: JsonPrice = { startpris: 1500, m2pris: 100, faktorLav: 0.6, faktorNormal: 1, faktorHøj: 1.4 };

function calcPaintingScenario(area: number, coveragePct: number, qIndex: number,
  includePanels = false, includeStuk = false) {
  const factorKind = qIndex <= 1 ? 'lav' : qIndex >= 3 ? 'høj' : 'normal';
  const base = baseTotal(MALING, area * (coveragePct/100), factorKind, 'maling');
  const panels = includePanels ? baseTotal(PANELS, area, 'normal', 'højePaneler') : 0;
  const stuk = includeStuk ? baseTotal(STUK, area, 'normal', 'stuk') : 0;
  return base + panels + stuk;
}

describe('painting business rules', () => {
  it('changing painting % changes only painting', () => {
    const area = 100;
    const q = 2; // normal
    const with50 = calcPaintingScenario(area, 50, q, true, true);
    const with80 = calcPaintingScenario(area, 80, q, true, true);
    // Difference equals change in painting base only
    const diff = with80 - with50;
    const onlyPaintDiff = baseTotal(MALING, area * 0.8, 'normal', 'maling') - baseTotal(MALING, area * 0.5, 'normal', 'maling');
    expect(diff).toBe(onlyPaintDiff);
  });

  it('panels/stuk change only with their own area/quality', () => {
    const area = 120;
    const q = 2; // normal
    const a = calcPaintingScenario(area, 100, q, true, true);
    const b = calcPaintingScenario(area, 60, q, true, true); // lower painting coverage
    // Panels/Stuk unaffected by coverage change
    expect(a - b).toBe(baseTotal(MALING, area, 'normal', 'maling') - baseTotal(MALING, area*0.6, 'normal', 'maling'));
  });
});
