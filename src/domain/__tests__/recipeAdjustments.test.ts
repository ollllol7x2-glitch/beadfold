import { describe, expect, it } from 'vitest';
import { getRecipeAdjustments } from '../recipeAdjustments';
import { generateGuidedRecipe } from '../recipeEngine';
import type { BeanLot } from '../types';

const bean: BeanLot = {
  id: 'bean-1', name: 'Test Bean', roaster: '', country: '', region: '', farm: '', variety: '', process: 'Washed', altitude: '', roastDate: null, roastLevel: 'light',
  initialWeightG: 200, remainingWeightG: 200, storageType: 'bag', state: 'opened', tastingNotes: [], description: '', imageUri: null, createdAt: '', updatedAt: '',
};

describe('recipe adjustments', () => {
  it('lists only settings changed by a preference', () => {
    const baseline = generateGuidedRecipe({ bean, now: new Date('2026-08-18T00:00:00Z') });
    const recommendation = { ...baseline, temperatureC: 90, ratio: 16, grindTarget: '중간 굵기', totalTimeSec: 180 };
    expect(getRecipeAdjustments(baseline, recommendation)).toEqual([
      { label: '온도', before: '93℃', after: '90℃' },
      { label: '물 비율', before: '1:16.7', after: '1:16' },
      { label: '분쇄도', before: '중간보다 조금 곱게', after: '중간 굵기' },
      { label: '총 시간', before: '2분 45초', after: '3분 00초' },
    ]);
  });

  it('keeps the list empty when the preference does not change the recommendation', () => {
    const recipe = generateGuidedRecipe({ bean, now: new Date('2026-08-18T00:00:00Z') });
    expect(getRecipeAdjustments(recipe, recipe)).toEqual([]);
  });
});
