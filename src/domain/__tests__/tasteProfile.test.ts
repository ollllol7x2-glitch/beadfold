import { describe, expect, it } from 'vitest';
import { calculateTasteProfile } from '../tasteProfile';
import { emptyTasteValues, type Cup } from '../types';

const cup = (id: string, satisfaction: Cup['satisfaction'], flavor: string): Cup => ({
  id, brewSessionId: id, beanId: 'bean', kind: 'home', beanName: 'Ethiopia Guji',
  beanSnapshot: { id: 'bean', name: 'Ethiopia Guji', roaster: '', country: 'Ethiopia', region: 'Guji', farm: '', variety: '', process: 'Washed', altitude: '', roastDate: null, roastLevel: 'light', initialWeightG: 200, remainingWeightG: 100, storageType: 'bag', state: 'opened', tastingNotes: [], description: '', imageUri: null, createdAt: '', updatedAt: '' },
  recipeSnapshot: null, satisfaction, flavorTags: [flavor], taste: emptyTasteValues(), memo: '', imageUri: null, cafeName: '', drinkName: '', createdAt: id, updatedAt: id,
});

describe('taste profile', () => {
  it('does not overstate insights before three ratings', () => {
    expect(calculateTasteProfile([cup('1', 'loved', 'Floral')]).insight).toContain('2잔만 더');
  });

  it('aggregates preference only from rated cups', () => {
    const profile = calculateTasteProfile([cup('1', 'loved', 'Floral'), cup('2', 'good', 'Floral'), cup('3', 'good', 'Clean'), cup('4', null, 'Funky')]);
    expect(profile.ratedCupCount).toBe(3);
    expect(profile.topFlavors[0]?.label).toBe('Floral');
    expect(profile.insight).toContain('꽃향');
  });

  it('keeps unrated detailed taste values empty', () => {
    expect(emptyTasteValues()).toEqual({ acidity: null, sweetness: null, body: null, bitterness: null, aroma: null, aftertaste: null, balance: null });
  });

  it('does not treat an unknown roast as a preference', () => {
    const unknown = cup('unknown', 'loved', 'Floral');
    unknown.beanSnapshot = { ...unknown.beanSnapshot!, roastLevel: 'unknown' };
    const profile = calculateTasteProfile([unknown, cup('2', 'good', 'Clean'), cup('3', 'good', 'Sweet')]);
    expect(profile.topRoasts.some((item) => item.label === 'unknown')).toBe(false);
  });
});
