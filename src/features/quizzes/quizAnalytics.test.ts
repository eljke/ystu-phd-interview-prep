import { describe, expect, it } from 'vitest';
import { topics } from '../../content/topics';
import type { QuizAttempt } from '../../entities/progress/progress';
import { calculateQuizAnalytics } from './quizAnalytics';

describe('quiz analytics', () => {
  it('counts objective and self-checked recall scores by section', () => {
    const attempts: QuizAttempt[] = [
      {
        id: 'attempt-1',
        profileId: 'user-1',
        topicId: 'practice-mixed',
        correct: 1,
        total: 2,
        score: 0.75,
        answers: {},
        completedAt: '2026-08-01T12:00:00.000Z',
        updatedAt: '2026-08-01T12:00:00.000Z',
        questionResults: [
          { questionId: 'q1', topicId: topics[0]!.id, correct: true, score: 1 },
          { questionId: 'q2', topicId: topics[16]!.id, correct: false, score: 0.5 },
        ],
      },
    ];
    const result = calculateQuizAnalytics(attempts, topics);
    expect(result.accuracy).toBe(0.75);
    expect(result.bySection['mathematical-modeling'].accuracy).toBe(1);
    expect(result.bySection['numerical-methods'].accuracy).toBe(0.5);
  });
});
