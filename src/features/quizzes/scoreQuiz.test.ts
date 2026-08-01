import { describe, expect, it } from 'vitest';
import type { QuizQuestion } from '../../entities/content/topic';
import { isAnswerCorrect } from './scoreQuiz';

describe('fill-blank scoring', () => {
  const question: QuizQuestion = {
    id: 'term',
    type: 'fill-blank',
    prompt: 'Назовите термин',
    explanation: 'Короткий термин.',
    keyPointIds: ['term'],
    acceptedAnswers: ['расчётная сетка', 'сетка'],
    caseSensitive: false,
  };

  it('ignores case, ё variants, punctuation and extra spaces for short terms', () => {
    expect(isAnswerCorrect(question, '  РАСЧЁТНАЯ---СЕТКА! ')).toBe(true);
  });
});
