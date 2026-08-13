import type { BrewSession, RecipeStep } from './types';

export interface BrewProjection {
  stepIndex: number;
  step: RecipeStep;
  stepElapsedMs: number;
  stepRemainingMs: number;
  totalElapsedMs: number;
  totalRemainingMs: number;
  completed: boolean;
}

export function startReadySession(session: BrewSession, now = Date.now()): BrewSession {
  return {
    ...session,
    status: 'active',
    startedAt: now,
    stepIndex: 0,
    stepStartedAt: now,
    pausedAt: null,
    pausedDurationMs: 0,
  };
}

export function projectBrew(session: BrewSession, now = Date.now()): BrewProjection {
  const steps = session.recipeSnapshot.steps;
  if (!steps.length) throw new Error('브루잉 단계가 없어요.');
  const clockNow = session.pausedAt ?? now;
  let remainingElapsed = Math.max(0, clockNow - session.stepStartedAt - session.pausedDurationMs);
  let stepIndex = session.stepIndex;
  let elapsedBeforeCurrent = session.recipeSnapshot.steps
    .slice(0, session.stepIndex)
    .reduce((sum, step) => sum + step.durationSec * 1000, 0);

  while (stepIndex < steps.length - 1 && remainingElapsed >= steps[stepIndex]!.durationSec * 1000) {
    remainingElapsed -= steps[stepIndex]!.durationSec * 1000;
    elapsedBeforeCurrent += steps[stepIndex]!.durationSec * 1000;
    stepIndex += 1;
  }

  const step = steps[stepIndex]!;
  const stepDurationMs = step.durationSec * 1000;
  const completed = stepIndex === steps.length - 1 && remainingElapsed >= stepDurationMs;
  const totalDurationMs = session.recipeSnapshot.totalTimeSec * 1000;
  const totalElapsedMs = Math.min(totalDurationMs, elapsedBeforeCurrent + remainingElapsed);
  return {
    stepIndex,
    step,
    stepElapsedMs: Math.min(stepDurationMs, remainingElapsed),
    stepRemainingMs: Math.max(0, stepDurationMs - remainingElapsed),
    totalElapsedMs,
    totalRemainingMs: Math.max(0, totalDurationMs - totalElapsedMs),
    completed,
  };
}

export function resumeSession(session: BrewSession, now = Date.now()): BrewSession {
  if (!session.pausedAt) return session;
  return {
    ...session,
    status: 'active',
    pausedDurationMs: session.pausedDurationMs + Math.max(0, now - session.pausedAt),
    pausedAt: null,
  };
}

export function pauseSession(session: BrewSession, now = Date.now()): BrewSession {
  if (session.pausedAt) return session;
  return { ...session, status: 'paused', pausedAt: now };
}

export function skipStep(session: BrewSession, now = Date.now()): BrewSession {
  const nextIndex = Math.min(session.recipeSnapshot.steps.length - 1, session.stepIndex + 1);
  return {
    ...session,
    stepIndex: nextIndex,
    stepStartedAt: now,
    pausedAt: session.pausedAt ? now : null,
    pausedDurationMs: 0,
  };
}

export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
