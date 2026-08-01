import { describe, expect, it } from 'vitest';
import { rotateRoles } from './roleRotation';

describe('rotateRoles', () => {
  it('swaps participants', () => expect(rotateRoles({ responderId: 'a', reviewerId: 'b' })).toEqual({ responderId: 'b', reviewerId: 'a' }));
});
