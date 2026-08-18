import { describe, expect, it } from 'vitest';
import { getBeanRecommendations } from '../beanRecommendations';
import { type TasteProfile } from '../types';

const profile: TasteProfile = {
  cupCount: 6, ratedCupCount: 6, averageScore: 2.6, insight: '', recentTrend: '',
  topFlavors: [{ label: 'Fruity', count: 4, score: 2.8 }, { label: 'Floral', count: 3, score: 2.7 }],
  topOrigins: [], topProcesses: [], topRoasts: [],
  tasteAverages: [
    { key: 'acidity', value: 4.5, count: 6 }, { key: 'sweetness', value: 3.6, count: 6 },
    { key: 'body', value: 2.4, count: 6 }, { key: 'bitterness', value: 1.3, count: 6 },
    { key: 'aroma', value: 4.5, count: 6 }, { key: 'aftertaste', value: 4.2, count: 6 },
    { key: 'balance', value: 3.9, count: 6 },
  ],
};

describe('bean recommendations', () => {
  it('matches a bright floral profile to an Ethiopian washed coffee', () => {
    expect(getBeanRecommendations(profile)[0]).toMatchObject({ country: 'Ethiopia', process: 'Washed', roastLevel: 'light' });
  });

  it('waits until a meaningful preference profile is available', () => {
    expect(getBeanRecommendations({ ...profile, ratedCupCount: 2 })).toEqual([]);
  });
});
