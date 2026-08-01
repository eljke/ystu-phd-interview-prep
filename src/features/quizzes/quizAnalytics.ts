import type { Topic, TopicSection } from '../../entities/content/topic';
import type { QuizAttempt } from '../../entities/progress/progress';

export interface QuizAnalytics {
  attempts: number;
  answered: number;
  accuracy: number;
  bySection: Record<TopicSection, { answered: number; accuracy: number }>;
}

export function calculateQuizAnalytics(
  attempts: QuizAttempt[],
  topics: readonly Topic[],
): QuizAnalytics {
  const sectionByTopic = new Map(topics.map((topic) => [topic.id, topic.section]));
  const sectionScores = new Map<TopicSection, number[]>();
  const scores: number[] = [];
  for (const attempt of attempts) {
    if (attempt.questionResults?.length) {
      for (const result of attempt.questionResults) {
        const score = result.score ?? (result.correct ? 1 : 0);
        scores.push(score);
        const section = sectionByTopic.get(result.topicId);
        if (section) sectionScores.set(section, [...(sectionScores.get(section) ?? []), score]);
      }
    } else {
      scores.push(
        ...Array.from({ length: attempt.total }, (_, index) => (index < attempt.correct ? 1 : 0)),
      );
    }
  }
  const summarize = (values: number[]) => ({
    answered: values.length,
    accuracy: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
  });
  return {
    attempts: attempts.length,
    ...summarize(scores),
    bySection: {
      'mathematical-modeling': summarize(sectionScores.get('mathematical-modeling') ?? []),
      'numerical-methods': summarize(sectionScores.get('numerical-methods') ?? []),
      'software-complexes': summarize(sectionScores.get('software-complexes') ?? []),
    },
  };
}
