export function calculatePairReadiness(a: number, b: number): number {
  if (![a, b].every((value) => Number.isFinite(value) && value >= 0 && value <= 1)) {
    throw new RangeError('Readiness values must be within 0..1');
  }
  return Math.min(a, b);
}
