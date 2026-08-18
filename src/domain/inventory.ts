export type InventoryStatus = {
  doseG: number;
  servings: number;
  shortageG: number;
  message: string;
  tone: 'neutral' | 'caution' | 'critical';
};

/**
 * Keep every inventory message tied to the dose the person can actually brew
 * with, rather than a disconnected fixed gram threshold.
 */
export function getInventoryStatus(remainingWeightG: number, recipeDoseG: number): InventoryStatus {
  const doseG = Math.max(0.1, recipeDoseG);
  const remainingG = Math.max(0, remainingWeightG);
  const servings = Math.floor(remainingG / doseG);
  const shortageG = Number(Math.max(0, doseG - remainingG).toFixed(1));

  if (remainingG === 0) {
    return { doseG, servings, shortageG: doseG, message: '남은 원두가 없어요.', tone: 'critical' };
  }
  if (servings === 0) {
    return { doseG, servings, shortageG, message: `한 잔을 내리려면 ${shortageG}g 더 필요해요.`, tone: 'critical' };
  }
  if (servings === 1) {
    return { doseG, servings, shortageG: 0, message: '한 잔 더 내릴 수 있어요.', tone: 'caution' };
  }
  return { doseG, servings, shortageG: 0, message: `약 ${servings}잔을 더 내릴 수 있어요.`, tone: 'neutral' };
}
