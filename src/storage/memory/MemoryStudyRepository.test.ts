import { expect, it } from 'vitest';
import type { QuizAttempt, TopicProgress } from '../../entities/progress/progress';
import { MemoryStudyRepository } from './MemoryStudyRepository';

it('resets practice statistics for one topic without touching another', async () => {
  const repository = new MemoryStudyRepository();
  const now = '2026-08-01T12:00:00.000Z';
  const progress = (topicId: string): TopicProgress => ({
    id: `user:${topicId}`, profileId: 'user', topicId, viewedSections: [], manualReview: false,
    status: 'studying', masteryScore: 0, updatedAt: now,
  });
  const attempt = (id: string, topicId: string): QuizAttempt => ({
    id, profileId: 'user', topicId, correct: 1, total: 1, score: 1, answers: {},
    questionResults: [{ questionId: `${topicId}:q`, topicId, correct: true }], completedAt: now, updatedAt: now,
  });
  await repository.saveTopicProgress(progress('topic-1'));
  await repository.saveTopicProgress(progress('topic-2'));
  await repository.saveQuizAttempt(attempt('a1', 'topic-1'));
  await repository.saveQuizAttempt(attempt('a2', 'topic-2'));

  await repository.resetPracticeStatistics('user', 'topic-1');

  expect(await repository.listQuizAttempts('user')).toEqual([attempt('a2', 'topic-2')]);
  expect(await repository.listTopicProgress('user')).toEqual([progress('topic-2')]);
});
