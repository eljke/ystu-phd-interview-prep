import { describe, expect, it } from 'vitest';
import { calculateReviewPriority } from './reviewPriority';

describe('calculateReviewPriority', () => {
  it('adds manual priority without exceeding 100', () => {
    const mastery = { score: 0, status: 'needs-review' as const, coverage: 0, quizAccuracy: 0, selfConfidence: 0, oralScore: 0 };
    expect(calculateReviewPriority({ mastery, failedCriticalCriteria: 4, manualReview: true, now: '2026-08-01T00:00:00Z' })).toBe(100);
  });
});
