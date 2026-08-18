import type { Recipe } from './types';

export type RecipeAdjustment = {
  label: string;
  before: string;
  after: string;
};

export type NextBrewAction = {
  label: string;
  instruction: string;
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

/** Turns value differences into the two or three concrete things to do next. */
export function getNextBrewActions(baseline: Recipe, recommendation: Recipe): NextBrewAction[] {
  const actions: NextBrewAction[] = [];
  if (baseline.temperatureC !== recommendation.temperatureC) actions.push({ label: '온도', instruction: `${recommendation.temperatureC}℃로 맞춰요` });
  if (baseline.totalTimeSec !== recommendation.totalTimeSec) actions.push({ label: '총 시간', instruction: `${formatDuration(recommendation.totalTimeSec)}까지 추출해요` });
  if (baseline.grindTarget !== recommendation.grindTarget) actions.push({ label: '분쇄도', instruction: `${recommendation.grindTarget}로 갈아요` });
  if (baseline.ratio !== recommendation.ratio) actions.push({ label: '물 비율', instruction: `1:${recommendation.ratio}로 맞춰요` });
  return actions.slice(0, 3);
}
