import type { Recipe } from './types';

export type RecipeAdjustment = {
  label: string;
  before: string;
  after: string;
};

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}분 ${String(seconds % 60).padStart(2, '0')}초`;
}

/** Shows only the recipe fields that changed after a saved preference was applied. */
export function getRecipeAdjustments(baseline: Recipe, recommendation: Recipe): RecipeAdjustment[] {
  const adjustments: RecipeAdjustment[] = [];
  if (baseline.temperatureC !== recommendation.temperatureC) adjustments.push({ label: '온도', before: `${baseline.temperatureC}℃`, after: `${recommendation.temperatureC}℃` });
  if (baseline.ratio !== recommendation.ratio) adjustments.push({ label: '물 비율', before: `1:${baseline.ratio}`, after: `1:${recommendation.ratio}` });
  if (baseline.grindTarget !== recommendation.grindTarget) adjustments.push({ label: '분쇄도', before: baseline.grindTarget, after: recommendation.grindTarget });
  if (baseline.totalTimeSec !== recommendation.totalTimeSec) adjustments.push({ label: '총 시간', before: formatDuration(baseline.totalTimeSec), after: formatDuration(recommendation.totalTimeSec) });
  return adjustments;
}
