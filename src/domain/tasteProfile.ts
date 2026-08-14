import type { Cup, Satisfaction, TasteDimension, TasteProfile } from './types';
import { localizedFlavor, satisfactionScore } from './types';

function aggregate(cups: Cup[], labels: (cup: Cup) => string[]): TasteDimension[] {
  const values = new Map<string, { total: number; count: number }>();
  for (const cup of cups) {
    if (!cup.satisfaction) continue;
    for (const label of labels(cup).filter(Boolean)) {
      const current = values.get(label) ?? { total: 0, count: 0 };
      current.total += satisfactionScore[cup.satisfaction as Satisfaction];
      current.count += 1;
      values.set(label, current);
    }
  }
  return [...values.entries()]
    .map(([label, value]) => ({ label, count: value.count, score: Number((value.total / value.count).toFixed(2)) }))
    .sort((a, b) => b.score - a.score || b.count - a.count || a.label.localeCompare(b.label));
}

export function calculateTasteProfile(cups: Cup[]): TasteProfile {
  const rated = cups.filter((cup) => cup.satisfaction);
  const averageScore = rated.length
    ? Number((rated.reduce((sum, cup) => sum + satisfactionScore[cup.satisfaction!], 0) / rated.length).toFixed(2))
    : null;
  const topFlavors = aggregate(rated, (cup) => cup.flavorTags);
  const topOrigins = aggregate(rated, (cup) => cup.beanSnapshot?.country ? [cup.beanSnapshot.country] : []);
  const topProcesses = aggregate(rated, (cup) => cup.beanSnapshot?.process ? [cup.beanSnapshot.process] : []);
  const topRoasts = aggregate(rated, (cup) => cup.beanSnapshot?.roastLevel && cup.beanSnapshot.roastLevel !== 'unknown' ? [cup.beanSnapshot.roastLevel] : []);
  let insight = '커피를 마시고 첫 느낌을 남겨보세요.';
  let recentTrend = '기록이 쌓이면 최근 취향 변화를 보여드려요.';
  if (rated.length >= 3 && topFlavors[0]) {
    insight = `요즘은 ${localizedFlavor(topFlavors[0].label)} 계열의 커피를 자주 좋아했어요.`;
  } else if (rated.length > 0) {
    insight = `${3 - rated.length}잔만 더 기록하면 좋아하는 맛을 함께 찾아볼 수 있어요.`;
  }
  if (rated.length >= 4) {
    const recent = rated.slice(0, Math.max(2, Math.ceil(rated.length / 2)));
    const earlier = rated.slice(recent.length);
    if (earlier.length) {
      const average = (items: Cup[]) => items.reduce((sum, cup) => sum + satisfactionScore[cup.satisfaction!], 0) / items.length;
      const difference = average(recent) - average(earlier);
      recentTrend = difference > 0.25 ? '최근 기록의 만족도가 이전보다 높아졌어요.' : difference < -0.25 ? '최근 기록은 이전보다 아쉬움이 조금 늘었어요.' : '최근 만족도는 이전과 비슷하게 유지되고 있어요.';
    }
  }
  return {
    cupCount: cups.length,
    ratedCupCount: rated.length,
    averageScore,
    topFlavors: topFlavors.slice(0, 5),
    topOrigins: topOrigins.slice(0, 5),
    topProcesses: topProcesses.slice(0, 5),
    topRoasts: topRoasts.slice(0, 5),
    recentTrend,
    insight,
  };
}
