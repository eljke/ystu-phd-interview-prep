export interface PairRoles { responderId: string; reviewerId: string; }
export function rotateRoles(pair: PairRoles): PairRoles {
  if (pair.responderId === pair.reviewerId) throw new RangeError('Responder and reviewer must be different');
  return { responderId: pair.reviewerId, reviewerId: pair.responderId };
}
