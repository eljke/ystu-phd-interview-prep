import { describe, expect, it } from 'vitest';
import type { QuizQuestion } from '../../entities/content/topic';
import { isAnswerCorrect, isQuestionAnswered } from './scoreQuiz';

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

describe('question completion', () => {
  it('requires every pair in matching questions', () => {
    const question: QuizQuestion = {
      id: 'match', type: 'matching', prompt: 'Сопоставьте', explanation: 'Разбор', keyPointIds: [],
      left: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
      right: [{ id: 'x', text: 'X' }, { id: 'y', text: 'Y' }],
      pairs: { a: 'x', b: 'y' },
    };
    expect(isQuestionAnswered(question, { a: 'x' })).toBe(false);
    expect(isQuestionAnswered(question, { a: 'x', b: 'y' })).toBe(true);
  });

  it('accepts the visible ordering as a complete answer', () => {
    const question: QuizQuestion = {
      id: 'order', type: 'ordering', prompt: 'По порядку', explanation: 'Разбор', keyPointIds: [],
      items: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOrder: ['a', 'b'],
    };
    expect(isQuestionAnswered(question, ['a', 'b'])).toBe(true);
  });
});
