import { expect, it } from 'vitest';
import type { QuizQuestion } from '../../entities/content/topic';
import { createInitialQuizAnswers } from './createInitialAnswers';

it('prepares the visible initial order as the answer for ordering questions', () => {
  const questions: QuizQuestion[] = [
    {
      id: 'ordering-1',
      type: 'ordering',
      prompt: 'Расположите этапы',
      explanation: 'Порядок этапов',
      keyPointIds: ['kp-1'],
      items: [
        { id: 'a', text: 'Первый' },
        { id: 'b', text: 'Второй' },
      ],
      correctOrder: ['a', 'b'],
    },
    {
      id: 'single-1',
      type: 'single-choice',
      prompt: 'Выберите ответ',
      explanation: 'Ответ',
      keyPointIds: ['kp-1'],
      options: [
        { id: 'yes', text: 'Да' },
        { id: 'no', text: 'Нет' },
      ],
      correctOptionId: 'yes',
    },
  ];

  expect(createInitialQuizAnswers(questions)).toEqual({ 'ordering-1': ['a', 'b'] });
});
