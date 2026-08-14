import { describe, expect, it } from 'vitest';
import { generateGuidedRecipe, RECIPE_RULE_VERSION, validateRecipe } from '../recipeEngine';
import { emptyTasteValues, type BeanLot, type Cup } from '../types';

const bean: BeanLot = {
  id: 'bean-1', name: 'Guji Uraga', roaster: 'Test', country: 'Ethiopia', region: 'Guji', farm: '',
  variety: '74110', process: 'Washed', altitude: '2,000m', roastDate: '2026-08-05', roastLevel: 'light',
  initialWeightG: 200, remainingWeightG: 200, storageType: 'bag', state: 'opened',
  tastingNotes: ['Jasmine', 'Peach'], description: '', imageUri: null,
  createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z',
};

describe('guided recipe engine', () => {
  it('returns the same calculation for the same input and rule version', () => {
    const now = new Date('2026-08-10T00:00:00.000Z');
    const first = generateGuidedRecipe({ bean, now });
    const second = generateGuidedRecipe({ bean, now });
    expect(first).toEqual(second);
    expect(first.ruleVersion).toBe(RECIPE_RULE_VERSION);
  });

  it('keeps pour totals and time totals exact', () => {
    const recipe = generateGuidedRecipe({ bean, now: new Date('2026-08-10T00:00:00.000Z') });
    expect(recipe.steps.reduce((sum, step) => sum + step.waterDeltaMl, 0)).toBe(recipe.waterMl);
    expect(recipe.steps.reduce((sum, step) => sum + step.durationSec, 0)).toBe(recipe.totalTimeSec);
    expect(validateRecipe(recipe)).toEqual([]);
  });

  it('explains fresh-bean bloom adjustment and validates bad totals', () => {
    const recipe = generateGuidedRecipe({ bean, now: new Date('2026-08-10T00:00:00.000Z') });
    expect(recipe.bloomSec).toBeGreaterThan(35);
    expect(recipe.explanation.some((reason) => reason.includes('뜸 시간'))).toBe(true);
    expect(validateRecipe({ ...recipe, waterMl: recipe.waterMl + 5 })).toContainEqual(expect.stringContaining('일치하지 않아요'));
  });

  it('uses a recently loved recipe as a preference signal', () => {
    const now = new Date('2026-08-10T00:00:00.000Z');
    const previous = generateGuidedRecipe({ bean, now });
    previous.temperatureC = 87;
    previous.totalTimeSec = 210;
    previous.grindTarget = '내가 좋아한 분쇄도';
    const cup: Cup = {
      id: 'cup-loved', brewSessionId: null, beanId: bean.id, kind: 'home', beanName: bean.name,
      beanSnapshot: bean, recipeSnapshot: previous, satisfaction: 'loved', flavorTags: [], taste: emptyTasteValues(),
      memo: '', imageUri: null, cafeName: '', drinkName: '', createdAt: now.toISOString(), updatedAt: now.toISOString(),
    };
    const recipe = generateGuidedRecipe({ bean, previousCups: [cup], now });
    expect(recipe.grindTarget).toBe('내가 좋아한 분쇄도');
    expect(recipe.explanation.some((reason) => reason.includes('최근 기록'))).toBe(true);
    expect(validateRecipe(recipe)).toEqual([]);
  });

  it('uses an honest neutral starting point when roast level is unknown', () => {
    const recipe = generateGuidedRecipe({ bean: { ...bean, roastLevel: 'unknown' }, now: new Date('2026-08-10T00:00:00.000Z') });
    expect(recipe.temperatureC).toBe(92);
    expect(recipe.grindTarget).toBe('중간 굵기');
    expect(recipe.explanation[0]).toContain('로스팅 정도가 비어 있어');
    expect(validateRecipe(recipe)).toEqual([]);
  });
});
