import { localizedFlavor, roastLevelLabel, type RoastLevel, type TasteProfile, type TasteValues } from './types';

export type BeanRecommendation = {
  id: string;
  country: string;
  process: string;
  roastLevel: RoastLevel;
  tastingNotes: string[];
  reason: string;
};

type BeanProfile = Omit<BeanRecommendation, 'reason'> & {
  tastes: Required<Record<keyof TasteValues, number>>;
  flavorTags: string[];
};

const profiles: BeanProfile[] = [
  {
    id: 'ethiopia-washed-light', country: 'Ethiopia', process: 'Washed', roastLevel: 'light',
    tastingNotes: ['자스민', '복숭아', '홍차'], flavorTags: ['Floral', 'Fruity', 'Juicy', 'Clean'],
    tastes: { acidity: 4.7, sweetness: 3.4, body: 2.2, bitterness: 1.1, aroma: 4.6, aftertaste: 4.3, balance: 3.8 },
  },
  {
    id: 'kenya-washed-medium-light', country: 'Kenya', process: 'Washed', roastLevel: 'medium-light',
    tastingNotes: ['자몽', '베리', '흑설탕'], flavorTags: ['Fruity', 'Juicy', 'Sweet', 'Clean'],
    tastes: { acidity: 4.6, sweetness: 4.0, body: 2.7, bitterness: 1.4, aroma: 3.7, aftertaste: 4.4, balance: 3.9 },
  },
  {
    id: 'rwanda-washed-light', country: 'Rwanda', process: 'Washed', roastLevel: 'light',
    tastingNotes: ['살구', '홍차', '꽃향'], flavorTags: ['Floral', 'Fruity', 'Clean'],
    tastes: { acidity: 4.1, sweetness: 3.7, body: 2.8, bitterness: 1.5, aroma: 4.2, aftertaste: 4.1, balance: 4.1 },
  },
  {
    id: 'costa-rica-honey-medium-light', country: 'Costa Rica', process: 'Honey', roastLevel: 'medium-light',
    tastingNotes: ['꿀', '살구', '캐러멜'], flavorTags: ['Sweet', 'Fruity', 'Clean'],
    tastes: { acidity: 3.6, sweetness: 4.3, body: 3.4, bitterness: 1.9, aroma: 3.6, aftertaste: 3.7, balance: 4.3 },
  },
  {
    id: 'colombia-natural-medium-light', country: 'Colombia', process: 'Natural', roastLevel: 'medium-light',
    tastingNotes: ['딸기', '와인', '초콜릿'], flavorTags: ['Fruity', 'Sweet', 'Funky'],
    tastes: { acidity: 3.1, sweetness: 4.5, body: 3.6, bitterness: 2.4, aroma: 4.2, aftertaste: 3.8, balance: 3.7 },
  },
  {
    id: 'guatemala-washed-medium', country: 'Guatemala', process: 'Washed', roastLevel: 'medium',
    tastingNotes: ['사과', '아몬드', '밀크초콜릿'], flavorTags: ['Clean', 'Nutty', 'Sweet'],
    tastes: { acidity: 3.1, sweetness: 3.5, body: 3.8, bitterness: 2.2, aroma: 3.2, aftertaste: 3.6, balance: 4.4 },
  },
];

const axisLabel: Record<keyof TasteValues, string> = {
  acidity: '산미', sweetness: '단맛', body: '질감', bitterness: '쓴맛', aroma: '향', aftertaste: '여운', balance: '균형',
};

export function getBeanRecommendations(profile: TasteProfile): BeanRecommendation[] {
  if (profile.ratedCupCount < 3 || profile.tasteAverages.length < 3) return [];
  const target = new Map(profile.tasteAverages.map((item) => [item.key, item.value]));
  const favoriteFlavors = new Set(profile.topFlavors.map((item) => item.label));

  return profiles
    .map((candidate) => ({ candidate, score: similarity(candidate, target, favoriteFlavors) }))
    .sort((first, second) => second.score - first.score)
    .slice(0, 3)
    .map(({ candidate }) => ({
      id: candidate.id,
      country: candidate.country,
      process: candidate.process,
      roastLevel: candidate.roastLevel,
      tastingNotes: candidate.tastingNotes,
      reason: recommendationReason(candidate, target, favoriteFlavors),
    }));
}

function similarity(candidate: BeanProfile, target: Map<keyof TasteValues, number>, favoriteFlavors: Set<string>) {
  const ratedAxes = [...target.entries()];
  const distance = ratedAxes.reduce((total, [key, value]) => total + Math.abs(candidate.tastes[key] - value), 0) / ratedAxes.length;
  const flavorBonus = candidate.flavorTags.filter((flavor) => favoriteFlavors.has(flavor)).length * 0.28;
  return -distance + flavorBonus;
}

function recommendationReason(candidate: BeanProfile, target: Map<keyof TasteValues, number>, favoriteFlavors: Set<string>) {
  const flavors = candidate.flavorTags.filter((flavor) => favoriteFlavors.has(flavor)).slice(0, 2).map(localizedFlavor);
  const strongestAxes = [...target.entries()]
    .filter(([, value]) => value >= 3.8)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 2)
    .map(([key]) => axisLabel[key]);
  const flavorCopy = flavors.length ? `${joinKorean(flavors)} 향미를 좋아하고, ` : '';
  const axisCopy = strongestAxes.length ? `${joinKorean(strongestAxes)}이 선명한 커피를 선호하는 취향에 잘 맞아요.` : '기록된 취향에 잘 맞아요.';
  return `${flavorCopy}${axisCopy}`;
}

function joinKorean(items: string[]) {
  if (items.length < 2) return items[0] ?? '';
  if (items.length === 2) return `${items[0]}과 ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}과 ${items.at(-1)}`;
}

export function recommendationTitle(recommendation: BeanRecommendation) {
  return `${recommendation.country} ${recommendation.process}`;
}

export function recommendationDetail(recommendation: BeanRecommendation) {
  return `${recommendation.country} · ${recommendation.process} · ${roastLevelLabel[recommendation.roastLevel]}`;
}
