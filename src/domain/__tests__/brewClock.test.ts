import { describe, expect, it } from 'vitest';
import { pauseSession, projectBrew, resumeSession, skipStep, startReadySession } from '../brewClock';
import { generateGuidedRecipe } from '../recipeEngine';
import type { BeanLot, BrewSession } from '../types';

const bean: BeanLot = {
  id: 'bean-1', name: 'Test Bean', roaster: '', country: 'Kenya', region: 'Nyeri', farm: '', variety: 'SL28',
  process: 'Washed', altitude: '', roastDate: null, roastLevel: 'medium-light', initialWeightG: 200,
  remainingWeightG: 200, storageType: 'bag', state: 'opened', tastingNotes: [], description: '', imageUri: null,
  createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z',
};
const recipe = generateGuidedRecipe({ bean, now: new Date('2026-08-13T00:00:00Z') });
const startedAt = 1_000_000;
const session: BrewSession = {
  id: 'brew-1', beanId: bean.id, recipeId: recipe.id, status: 'active', recipeSnapshot: recipe,
  beanSnapshot: bean, startedAt, stepIndex: 0, stepStartedAt: startedAt, pausedAt: null,
  pausedDurationMs: 0, completedAt: null, createdAt: new Date(startedAt).toISOString(),
};

describe('timestamp brew clock', () => {
  it('does not begin a ready session until the user explicitly starts it', () => {
    const ready = { ...session, status: 'ready' as const };
    const active = startReadySession(ready, startedAt + 30_000);
    expect(active.status).toBe('active');
    expect(projectBrew(active, startedAt + 30_000).stepElapsedMs).toBe(0);
  });
  it('restores the correct step after background time passes', () => {
    const elapsed = (recipe.steps[0]!.durationSec + 5) * 1000;
    const projection = projectBrew(session, startedAt + elapsed);
    expect(projection.stepIndex).toBe(1);
    expect(projection.stepElapsedMs).toBe(5000);
  });

  it('does not consume time while paused', () => {
    const paused = pauseSession(session, startedAt + 10_000);
    const duringPause = projectBrew(paused, startedAt + 80_000);
    expect(duringPause.stepElapsedMs).toBe(10_000);
    const resumed = resumeSession(paused, startedAt + 80_000);
    expect(projectBrew(resumed, startedAt + 85_000).stepElapsedMs).toBe(15_000);
  });

  it('skips to the next step with a fresh timestamp', () => {
    const skipped = skipStep(session, startedAt + 7_000);
    expect(skipped.stepIndex).toBe(1);
    expect(projectBrew(skipped, startedAt + 9_000).stepElapsedMs).toBe(2_000);
  });
});
