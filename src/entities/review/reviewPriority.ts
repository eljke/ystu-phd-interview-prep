import type { MasteryResult } from '../progress/mastery';

export interface ReviewPriorityInput {
  mastery: MasteryResult;
  lastReviewedAt?: string;
  failedCriticalCriteria: number;
  manualReview: boolean;
  now: string;
}

export function calculateReviewPriority(input: ReviewPriorityInput): number {
  const inverseMastery = (1 - input.mastery.score) * 55;
  const days = input.lastReviewedAt
    ? Math.max(0, Math.min(30, (Date.parse(input.now) - Date.parse(input.lastReviewedAt)) / 86_400_000))
    : 30;
  const age = (days / 30) * 20;
  const critical = Math.min(15, input.failedCriticalCriteria * 7.5);
  const manual = input.manualReview ? 20 : 0;
  return Math.round(Math.min(100, Math.max(0, inverseMastery + age + critical + manual)));
}
