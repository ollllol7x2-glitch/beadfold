import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../contrast';
import { colors } from '../tokens';

describe('brand contrast', () => {
  it('keeps primary text and button pairs above WCAG AA', () => {
    expect(contrastRatio(colors.charcoal, colors.cream)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.espresso, colors.cream)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.cream, colors.espresso)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.neutral800, colors.white)).toBeGreaterThanOrEqual(4.5);
  });

  it('documents soft gold as an accent rather than body text', () => {
    expect(contrastRatio(colors.softGold, colors.cream)).toBeLessThan(4.5);
  });
});
