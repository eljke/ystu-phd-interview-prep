import { describe, expect, it } from 'vitest';
import { calculateMastery } from './mastery';

describe('calculateMastery', () => {
  it('returns not-started for untouched topic', () => {
    expect(
      calculateMastery({
        progress: undefined,
        quizAttempts: [],
        oralAttempts: [],
        partnerAssessments: [],
        criticalCriterionIds: [],
        now: '2026-08-01T00:00:00Z',
      }),
    ).toMatchObject({ score: 0, status: 'not-started' });
  });

  it('allows a later successful oral attempt to recover from an old critical miss', () => {
    const progress = {
      id: 'p-topic',
      profileId: 'p1',
      topicId: 't1',
      viewedSections: [
        'shortAnswer',
        'extendedAnswer',
        'keyPoints',
        'formulas',
        'example',
        'commonMistakes',
      ] as const,
      manualReview: false,
      status: 'studying' as const,
      masteryScore: 0,
      updatedAt: '2026-08-02T00:00:00Z',
    };
    const quizAttempts = [
      {
        id: 'q1',
        profileId: 'p1',
        topicId: 't1',
        correct: 1,
        total: 1,
        score: 0.9,
        answers: {},
        completedAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      },
      {
        id: 'q2',
        profileId: 'p1',
        topicId: 't1',
        correct: 1,
        total: 1,
        score: 0.9,
        answers: {},
        completedAt: '2026-08-02T00:00:00Z',
        updatedAt: '2026-08-02T00:00:00Z',
      },
    ];
    const oralAttempts = [
      {
        id: 'o-old',
        profileId: 'p1',
        topicId: 't1',
        selfConfidence: 0.3,
        oralScore: 0.4,
        criteria: [{ criterionId: 'critical', result: 'missed' as const }],
        startedAt: '2026-08-01T00:00:00Z',
        completedAt: '2026-08-01T00:01:00Z',
        updatedAt: '2026-08-01T00:01:00Z',
      },
      {
        id: 'o-new',
        profileId: 'p1',
        topicId: 't1',
        selfConfidence: 0.9,
        oralScore: 0.9,
        criteria: [{ criterionId: 'critical', result: 'covered' as const }],
        startedAt: '2026-08-02T00:00:00Z',
        completedAt: '2026-08-02T00:01:00Z',
        updatedAt: '2026-08-02T00:01:00Z',
      },
    ];

    const result = calculateMastery({
      progress: { ...progress, viewedSections: [...progress.viewedSections] },
      quizAttempts,
      oralAttempts,
      partnerAssessments: [],
      criticalCriterionIds: ['critical'],
      now: '2026-08-02T00:02:00Z',
    });

    expect(result.status).toBe('mastered');
  });
});
