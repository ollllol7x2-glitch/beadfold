import type { BeanLot, Cup, Gear, Recipe, RecipeStep, RoastLevel } from './types';

export const RECIPE_RULE_VERSION = 'beanfold-guided-v1.1.0';

export interface GuidedRecipeInput {
  bean: BeanLot;
  doseG?: number;
  grinder?: Gear | null;
  dripper?: Gear | null;
  filter?: Gear | null;
  water?: Gear | null;
  previousCups?: Cup[];
  now?: Date;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 0) => Number(value.toFixed(digits));

function ageInDays(roastDate: string | null, now: Date): number | null {
  if (!roastDate) return null;
  const parsed = new Date(`${roastDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / 86_400_000));
}

function roastSettings(roast: RoastLevel) {
  const settings: Record<RoastLevel, { temperature: number; ratio: number; grind: string }> = {
    unknown: { temperature: 92, ratio: 16, grind: '중간 굵기' },
    light: { temperature: 93, ratio: 16.5, grind: '중간보다 조금 곱게' },
    'medium-light': { temperature: 92, ratio: 16, grind: '중간보다 조금 곱게' },
    medium: { temperature: 90, ratio: 15.5, grind: '중간 굵기' },
    'medium-dark': { temperature: 88, ratio: 15, grind: '중간보다 조금 굵게' },
    dark: { temperature: 86, ratio: 14.5, grind: '중간보다 조금 굵게' },
  };
  return settings[roast];
}

function roastLabel(roast: RoastLevel) {
  const labels: Record<RoastLevel, string> = {
    unknown: '로스팅 정도를 입력하지 않은',
    light: '약하게 볶은',
    'medium-light': '중간보다 약하게 볶은',
    medium: '중간 정도로 볶은',
    'medium-dark': '중간보다 강하게 볶은',
    dark: '강하게 볶은',
  };
  return labels[roast];
}

function createSteps(waterMl: number, bloomSec: number, totalTimeSec: number): RecipeStep[] {
  const bloomWater = Math.min(waterMl, Math.max(30, Math.round((waterMl * 0.17) / 5) * 5));
  const remaining = waterMl - bloomWater;
  const first = Math.round((remaining * 0.48) / 5) * 5;
  const second = remaining - first;
  const pourOneSec = Math.max(25, Math.round(totalTimeSec * 0.19));
  const waitSec = Math.max(20, Math.round(totalTimeSec * 0.17));
  const pourTwoSec = Math.max(25, Math.round(totalTimeSec * 0.2));
  const drawdownSec = Math.max(1, totalTimeSec - bloomSec - pourOneSec - waitSec - pourTwoSec);

  return [
    {
      id: 'step-bloom', order: 0, action: 'bloom', name: '뜸 들이기', durationSec: bloomSec,
      waterDeltaMl: bloomWater, waterTotalMl: bloomWater,
      instruction: `전체 원두를 고르게 적시며 ${bloomWater}ml까지 부어주세요.`,
    },
    {
      id: 'step-pour-1', order: 1, action: 'pour', name: '첫 번째 붓기', durationSec: pourOneSec,
      waterDeltaMl: first, waterTotalMl: bloomWater + first,
      instruction: `중앙에서 바깥쪽으로 천천히 ${bloomWater + first}ml까지 부어주세요.`,
    },
    {
      id: 'step-wait', order: 2, action: 'wait', name: '잠시 기다리기', durationSec: waitSec,
      waterDeltaMl: 0, waterTotalMl: bloomWater + first,
      instruction: '물이 내려가도록 기다리며 베드가 고르게 유지되는지 살펴보세요.',
    },
    {
      id: 'step-pour-2', order: 3, action: 'pour', name: '마지막 붓기', durationSec: pourTwoSec,
      waterDeltaMl: second, waterTotalMl: waterMl,
      instruction: `부드럽게 원을 그리며 목표 물양 ${waterMl}ml까지 마무리하세요.`,
    },
    {
      id: 'step-drawdown', order: 4, action: 'wait', name: '마무리 기다리기', durationSec: drawdownSec,
      waterDeltaMl: 0, waterTotalMl: waterMl,
      instruction: '드리퍼의 물이 충분히 빠질 때까지 기다린 뒤 서버를 분리하세요.',
    },
  ];
}

export function validateRecipe(recipe: Pick<Recipe, 'doseG' | 'waterMl' | 'temperatureC' | 'totalTimeSec' | 'steps'>): string[] {
  const errors: string[] = [];
  if (recipe.doseG < 5 || recipe.doseG > 60) errors.push('원두량은 5-60g 범위여야 해요.');
  if (recipe.waterMl < 50 || recipe.waterMl > 1000) errors.push('물양은 50-1,000ml 범위여야 해요.');
  if (recipe.temperatureC < 75 || recipe.temperatureC > 100) errors.push('물 온도는 75-100℃ 범위여야 해요.');
  if (recipe.totalTimeSec < 30 || recipe.totalTimeSec > 900) errors.push('총 시간은 30초-15분 범위여야 해요.');
  if (!recipe.steps.length) errors.push('브루잉 단계가 하나 이상 필요해요.');
  const pourTotal = recipe.steps.reduce((sum, step) => sum + step.waterDeltaMl, 0);
  if (Math.abs(pourTotal - recipe.waterMl) > 0.01) {
    errors.push(`단계별 물양 합계 ${pourTotal}ml가 목표 물양 ${recipe.waterMl}ml와 일치하지 않아요.`);
  }
  const durationTotal = recipe.steps.reduce((sum, step) => sum + step.durationSec, 0);
  if (durationTotal !== recipe.totalTimeSec) {
    errors.push(`단계별 시간 합계 ${durationTotal}초가 총 시간 ${recipe.totalTimeSec}초와 일치하지 않아요.`);
  }
  return errors;
}

export function generateGuidedRecipe(input: GuidedRecipeInput): Recipe {
  const { bean } = input;
  const now = input.now ?? new Date();
  const preferred = input.previousCups?.find((cup) => cup.satisfaction === 'loved' && cup.recipeSnapshot)?.recipeSnapshot;
  const doseG = clamp(input.doseG ?? preferred?.doseG ?? 15, 10, 30);
  const settings = roastSettings(bean.roastLevel);
  const explanations = [
    bean.roastLevel === 'unknown'
      ? `로스팅 정도가 비어 있어 균형 잡힌 ${settings.temperature}℃에서 시작해요.`
      : `${roastLabel(bean.roastLevel)} 원두라 ${settings.temperature}℃에서 시작해요.`,
  ];
  let ratio = settings.ratio;
  let temperatureC = settings.temperature;
  let bloomSec = 35;
  let totalTimeSec = 165;
  let grindTarget = settings.grind;
  const process = bean.process.toLowerCase();

  if (process.includes('natural') || process.includes('honey')) {
    temperatureC -= 1;
    ratio -= 0.2;
    explanations.push('내추럴·허니 가공의 단맛과 질감을 살리도록 온도와 비율을 조금 낮췄어요.');
  } else if (process.includes('washed')) {
    ratio += 0.2;
    explanations.push('워시드 가공의 깨끗한 향미가 드러나도록 물 비율을 조금 높였어요.');
  }

  const age = ageInDays(bean.roastDate, now);
  if (age !== null && age <= 7) {
    bloomSec += 10;
    explanations.push(`로스팅 후 ${age}일째라 가스를 충분히 빼도록 뜸 시간을 늘렸어요.`);
  } else if (age !== null && age >= 35) {
    bloomSec -= 5;
    grindTarget = grindTarget === '중간보다 조금 굵게' ? '중간 굵기' : '중간보다 조금 곱게';
    explanations.push(`로스팅 후 ${age}일째라 향미를 충분히 얻도록 분쇄도를 조금 곱게 제안해요.`);
  }

  const dripperName = input.dripper?.name ?? '원뿔형 드리퍼';
  const flow = String(input.dripper?.metadata.flow ?? '').toLowerCase();
  if (flow === 'fast') {
    totalTimeSec -= 10;
    grindTarget = '중간보다 조금 곱게';
    explanations.push(`${dripperName}의 빠른 유속을 고려해 조금 고운 분쇄도를 제안해요.`);
  } else if (flow === 'slow') {
    totalTimeSec += 10;
    grindTarget = '중간보다 조금 굵게';
    explanations.push(`${dripperName}의 완만한 유속을 고려해 막힘을 줄이는 시작점을 골랐어요.`);
  }

  if (String(input.water?.metadata.hardness ?? '').toLowerCase() === 'hard') {
    temperatureC -= 1;
    explanations.push('미네랄이 많은 물을 고려해 과도한 추출을 줄이도록 온도를 1℃ 낮췄어요.');
  }

  const resistance = String(input.filter?.metadata.resistance ?? '').toLowerCase();
  if (resistance === 'high') {
    totalTimeSec += 10;
    grindTarget = '중간보다 조금 굵게';
    explanations.push(`${input.filter?.name ?? '필터'}의 저항을 고려해 조금 굵게 제안해요.`);
  } else if (resistance === 'low') {
    totalTimeSec -= 5;
    explanations.push(`${input.filter?.name ?? '필터'}의 빠른 물 빠짐을 고려해 추출 시간을 조금 줄였어요.`);
  }
  if (input.grinder?.metadata.range === 'stepped') explanations.push(`${input.grinder.name}의 가까운 눈금에서 시작해보세요.`);

  if (preferred) {
    ratio = preferred.ratio;
    temperatureC = preferred.temperatureC;
    bloomSec = preferred.bloomSec;
    totalTimeSec = preferred.totalTimeSec;
    grindTarget = preferred.grindTarget;
    explanations.push('이 원두로 좋았다고 남긴 최근 추출값을 다음 한 잔의 우선 시작점으로 사용해요.');
  }

  ratio = round(clamp(ratio, 13, 18), 1);
  temperatureC = round(clamp(temperatureC, 82, 96));
  bloomSec = round(clamp(bloomSec, 25, 60));
  totalTimeSec = round(clamp(totalTimeSec, 120, 240));
  const waterMl = Math.round((doseG * ratio) / 5) * 5;
  const steps = createSteps(waterMl, bloomSec, totalTimeSec);
  const timestamp = now.toISOString();
  const recipe: Recipe = {
    id: `guided-${bean.id}-${RECIPE_RULE_VERSION}`,
    beanId: bean.id,
    type: 'guided',
    name: `${bean.name} 추천 레시피`,
    source: 'BEANFOLD 추천',
    hotIce: 'hot',
    doseG,
    waterMl,
    ratio,
    temperatureC,
    grindTarget,
    grinder: input.grinder?.name ?? '사용 중인 그라인더',
    dripper: dripperName,
    filter: input.filter?.name ?? '종이 필터',
    waterProfile: input.water?.name ?? '일반 물',
    bloomSec,
    totalTimeSec,
    steps,
    explanation: explanations,
    ruleVersion: RECIPE_RULE_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const errors = validateRecipe(recipe);
  if (errors.length) throw new Error(errors.join(' '));
  return recipe;
}

export function createManualRecipe(bean: BeanLot, now = new Date()): Recipe {
  const timestamp = now.toISOString();
  const doseG = 15;
  const waterMl = 240;
  const totalTimeSec = 165;
  return {
    id: `manual-${bean.id}-${now.getTime()}`,
    beanId: bean.id,
    type: 'manual',
    name: `${bean.name} 나만의 레시피`,
    source: '직접 만든 레시피',
    hotIce: 'hot',
    doseG,
    waterMl,
    ratio: 16,
    temperatureC: 92,
    grindTarget: '중간보다 조금 곱게',
    grinder: '사용 중인 그라인더',
    dripper: '원뿔형 드리퍼',
    filter: '종이 필터',
    waterProfile: '일반 물',
    bloomSec: 35,
    totalTimeSec,
    steps: createSteps(waterMl, 35, totalTimeSec),
    explanation: ['직접 정한 값은 이 레시피를 실행할 때 그대로 사용해요.'],
    ruleVersion: 'manual-v1',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
