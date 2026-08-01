import type { QuizQuestion } from '../../entities/content/topic';
import type { QuizAnswer } from './scoreQuiz';

export function createInitialQuizAnswers(
  questions: readonly QuizQuestion[],
): Record<string, QuizAnswer> {
  return Object.fromEntries(
    questions
      .filter((question) => question.type === 'ordering')
      .map((question) => [
        question.id,
        question.items.map((item) => item.id),
      ]),
  );
}
