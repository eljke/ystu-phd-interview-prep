import { describe, expect, it } from 'vitest';
import { calculatePairReadiness } from './pairReadiness';

describe('calculatePairReadiness', () => {
  it('uses the weaker participant', () => expect(calculatePairReadiness(0.82, 0.61)).toBe(0.61));
});
