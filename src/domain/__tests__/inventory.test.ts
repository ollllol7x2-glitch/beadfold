import { describe, expect, it } from 'vitest';
import { getInventoryStatus } from '../inventory';

describe('inventory status', () => {
  it('calculates remaining servings from the recipe dose', () => {
    expect(getInventoryStatus(34, 17)).toMatchObject({ doseG: 17, servings: 2, shortageG: 0, tone: 'neutral' });
  });

  it('makes a shortage explicit when the current recipe cannot be brewed', () => {
    expect(getInventoryStatus(10, 15)).toMatchObject({ servings: 0, shortageG: 5, tone: 'critical' });
  });

  it('keeps the last full serving distinct from an insufficient amount', () => {
    expect(getInventoryStatus(15, 15)).toMatchObject({ servings: 1, shortageG: 0, tone: 'caution' });
  });
});
