export type RoastLevel = 'unknown' | 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';
export type BeanState = 'unspecified' | 'unopened' | 'opened' | 'frozen' | 'finished' | 'archived';
export type RecipeType = 'base' | 'guided' | 'manual' | 'imported';
export type BrewStatus = 'ready' | 'active' | 'paused' | 'completed' | 'abandoned';
export type Satisfaction = 'not_for_me' | 'good' | 'loved';
export type BrewAction = 'bloom' | 'pour' | 'wait' | 'stir' | 'swirl' | 'finish';

export interface BeanLot {
  id: string;
  name: string;
  roaster: string;
  country: string;
  region: string;
  farm: string;
  variety: string;
  process: string;
  altitude: string;
  roastDate: string | null;
  roastLevel: RoastLevel;
  initialWeightG: number;
  remainingWeightG: number;
  storageType: string;
  state: BeanState;
  tastingNotes: string[];
  description: string;
  imageUri: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Gear {
  id: string;
  category: 'grinder' | 'dripper' | 'filter' | 'kettle' | 'scale' | 'water';
  name: string;
  brand: string;
  isPrimary: boolean;
  isCustom: boolean;
  metadata: Record<string, string | number>;
}

export interface RecipeStep {
  id: string;
  order: number;
  action: BrewAction;
  name: string;
  durationSec: number;
  waterDeltaMl: number;
  waterTotalMl: number;
  instruction: string;
}

export interface Recipe {
  id: string;
  beanId: string | null;
  type: RecipeType;
  name: string;
  source: string;
  hotIce: 'hot' | 'ice';
  doseG: number;
  waterMl: number;
  ratio: number;
  temperatureC: number;
  grindTarget: string;
  grinder: string;
  dripper: string;
  filter: string;
  waterProfile: string;
  bloomSec: number;
  totalTimeSec: number;
  steps: RecipeStep[];
  explanation: string[];
  ruleVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrewSession {
  id: string;
  beanId: string;
  recipeId: string | null;
  status: BrewStatus;
  recipeSnapshot: Recipe;
  beanSnapshot: BeanLot;
  startedAt: number;
  stepIndex: number;
  stepStartedAt: number;
  pausedAt: number | null;
  pausedDurationMs: number;
  completedAt: number | null;
  createdAt: string;
}

export interface TasteValues {
  acidity: number | null;
  sweetness: number | null;
  body: number | null;
  bitterness: number | null;
  aroma: number | null;
  aftertaste: number | null;
  balance: number | null;
}

export interface Cup {
  id: string;
  brewSessionId: string | null;
  beanId: string | null;
  kind: 'home' | 'cafe';
  beanName: string;
  beanSnapshot: BeanLot | null;
  recipeSnapshot: Recipe | null;
  satisfaction: Satisfaction | null;
  flavorTags: string[];
  taste: TasteValues;
  memo: string;
  imageUri: string | null;
  cafeName: string;
  drinkName: string;
  createdAt: string;
  updatedAt: string;
}

export interface TasteDimension {
  label: string;
  count: number;
  score: number;
}

export interface TasteProfile {
  cupCount: number;
  ratedCupCount: number;
  averageScore: number | null;
  topFlavors: TasteDimension[];
  topOrigins: TasteDimension[];
  topProcesses: TasteDimension[];
  topRoasts: TasteDimension[];
  recentTrend: string;
  insight: string;
}

export const satisfactionScore: Record<Satisfaction, number> = {
  not_for_me: 1,
  good: 2,
  loved: 3,
};

export const satisfactionLabel: Record<Satisfaction, string> = {
  not_for_me: '아쉬웠어요',
  good: '괜찮았어요',
  loved: '좋았어요',
};

export const roastLevelLabel: Record<RoastLevel, string> = {
  unknown: '로스팅 미입력',
  light: '약배전',
  'medium-light': '중약배전',
  medium: '중배전',
  'medium-dark': '중강배전',
  dark: '강배전',
};

export const beanStateLabel: Record<BeanState, string> = {
  unspecified: '상태 미입력',
  unopened: '미개봉',
  opened: '개봉',
  frozen: '냉동',
  finished: '다 마심',
  archived: '보관됨',
};

export const flavorLabel: Record<string, string> = {
  Floral: '꽃향',
  Fruity: '과일',
  Juicy: '과즙',
  Sweet: '달콤함',
  Clean: '깔끔함',
  Creamy: '부드러움',
  Nutty: '고소함',
  Roasty: '구수함',
  Funky: '발효향',
};

export const localizedFlavor = (value: string) => flavorLabel[value] ?? value;

export const emptyTasteValues = (): TasteValues => ({
  acidity: null,
  sweetness: null,
  body: null,
  bitterness: null,
  aroma: null,
  aftertaste: null,
  balance: null,
});
